// controllers/checkoutController.js
const mongoose = require('mongoose');
const Application = require('../models/Application');
const User = require('../models/User');
const Purchase = require('../models/Purchase');
const { Coupon } = require('../models/Coupon');

const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

const pointsToRupees = (points) => points / 10;
const rupeesToPoints = (rupees) => rupees * 10;

exports.getCheckoutDetails = catchAsync(async (req, res, next) => {
  const { applicationId } = req.params;
  const userId = req.user.id;

  const application = await Application.findOne({
    applicationNumber: applicationId,
    student: userId
  }).populate({
    path: 'course',
    populate: {
      path: 'university'
    }
  });

  if (!application) {
    return res.status(404).json({
      status: 'error',
      message: 'Application not found'
    })
  }

  const user = await User.findById(userId).select('wallet');
  const checkoutItem = {
    id: application._id,
    type: 'application_fee',
    name: application.course.name,
    description: `Application fee for ${application.course.name}`,
    amount: application.course.applicationFee || 0,
    currency: 'INR',
    university: {
      name: application.course.university.name,
      logo: application.course.university.uni_logo
    },
    applicationNumber: application.applicationNumber,
    programName: application.course.name,
    intake: application.intake
  };

  const walletBalanceInRupees = pointsToRupees(user.wallet || 0);

  res.status(200).json({
    status: 'success',
    data: {
      checkoutItem,
      wallet: {
        points: user.wallet || 0,
        balanceInRupees: walletBalanceInRupees,
        currency: 'INR'
      }
    }
  });
});

exports.applyCoupon = catchAsync(async (req, res, next) => {
  const { code } = req.body;
  const { applicationId } = req.params;
  const userId = req.user.id;

  if (!code) {
    return res.status(400).json({
      status: 'error',
      message: 'Coupon code is required'
    });
  }

  // Find application
  const application = await Application.findOne({
    applicationNumber: applicationId,
    student: userId
  }).populate('course');

  if (!application) {
    return res.status(404).json({
      status: 'error',
      message: 'Application not found'
    });
  }

  const amount = application.course.applicationFee || 0;

  // Find active coupon
  const coupon = await Coupon.findOne({
    code: code.toUpperCase(),
    status: 'Active',
    type: 'coupon',
    validFrom: { $lte: new Date() },
    validTo: { $gte: new Date() }
  });

  if (!coupon) {
    return res.status(404).json({
      status: 'error',
      message: 'Coupon not found'
    });
  }

  // Check if coupon is user specific
  if (coupon.couponData?.isUserSpecific) {
    if (!coupon.couponData.users.includes(userId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Coupon is not valid for this user'
      })
    }
  }

  // Check usage limit
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return res.status(400).json({
      status: 'error',
      message: 'Coupon usage limit reached'
    })
  }

  // Check minimum purchase amount
  if (coupon.couponData?.minPurchaseAmount) {
    if (amount < coupon.couponData.minPurchaseAmount) {
      return res.status(400).json({
        status: 'error',
        message: `Minimum purchase of ₹${coupon.couponData.minPurchaseAmount} required`
      })
    }
  }

  // Calculate discount
  let discountAmount = 0;

  if (coupon.couponData?.discountType === 'percentage') {
    discountAmount = (amount * coupon.couponData.discountValue) / 100;

    // Apply max discount limit if exists
    if (coupon.couponData.maxDiscountAmount) {
      discountAmount = Math.min(discountAmount, coupon.couponData.maxDiscountAmount);
    }
  } else if (coupon.couponData?.discountType === 'fixed') {
    discountAmount = Math.min(coupon.couponData.discountValue, amount);
  }

  res.status(200).json({
    status: 'success',
    data: {
      coupon: {
        code: coupon.code,
        discountType: coupon.couponData.discountType,
        discountValue: coupon.couponData.discountValue,
        maxDiscount: coupon.couponData.maxDiscountAmount,
        minPurchase: coupon.couponData.minPurchaseAmount,
        valid: true,
        message: `${coupon.couponData.discountType === 'percentage' ?
          coupon.couponData.discountValue + '%' :
          '₹' + coupon.couponData.discountValue} discount applied!`
      },
      discountAmount
    }
  });
});

exports.processPayment = catchAsync(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { applicationId } = req.params;
    const {
      useWallet,
      couponCode,
      paymentMethod,
      transactionId
    } = req.body;

    const userId = req.user.id;

    const application = await Application.findOne({
      applicationNumber: applicationId,
      student: userId,
      paymentStatus: 'Pending'
    }).populate('course').session(session);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      })
    }

    if (application.paymentStatus === 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Application already paid'
      })
    }
    const user = await User.findById(userId).session(session);

    const originalAmount = application.course.applicationFee || 0;
    let finalAmount = originalAmount;
    let couponDiscount = 0;
    let walletPointsUsed = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        status: 'Active',
        type: 'coupon',
        validFrom: { $lte: new Date() },
        validTo: { $gte: new Date() }
      }).session(session);

      if (coupon) {
        if (coupon.couponData?.isUserSpecific) {
          if (!coupon.couponData.users.includes(userId)) {
            return res.status(400).json({
              success: false,
              message: 'Coupon is not valid for this user'
            })
          }
        }

        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
          return res.status(400).json({
            success: false,
            message: 'Coupon usage limit reached'
          })
        }

        if (coupon.couponData?.minPurchaseAmount) {
          if (originalAmount < coupon.couponData.minPurchaseAmount) {
            return res.status(400).json({
              success: false,
              message: `Minimum purchase of ₹${coupon.couponData.minPurchaseAmount} required`
            })
          }
        }

        if (coupon.couponData?.discountType === 'percentage') {
          couponDiscount = (originalAmount * coupon.couponData.discountValue) / 100;
          if (coupon.couponData.maxDiscountAmount) {
            couponDiscount = Math.min(couponDiscount, coupon.couponData.maxDiscountAmount);
          }
        } else if (coupon.couponData?.discountType === 'fixed') {
          couponDiscount = Math.min(coupon.couponData.discountValue, originalAmount);
        }

        finalAmount -= couponDiscount;

        coupon.usedCount += 1;
        await coupon.save({ session });
      }
    }

    if (useWallet && user.wallet > 0) {
      const maxWalletRupees = pointsToRupees(user.wallet);
      const walletRupeesToUse = Math.min(maxWalletRupees, finalAmount);
      walletPointsUsed = rupeesToPoints(walletRupeesToUse);

      finalAmount -= walletRupeesToUse;

      user.wallet -= walletPointsUsed;
      await user.save({ session });
    }

    const purchase = await Purchase.create([{
      user: userId,
      application: application._id,
      amount: finalAmount,
      originalAmount: originalAmount,
      couponDiscount: couponDiscount,
      couponCode: couponCode || '',
      isWalletUsed: useWallet,
      walletPointsUsed: walletPointsUsed,
      paymentMethod: paymentMethod,
      transactionId: transactionId || `TXN${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
      status: 'Completed',
      gst: 0
    }], { session });

    application.paymentStatus = 'Completed';
    await application.save({ session });
    await session.commitTransaction();

    res.status(200).json({
      status: 'success',
      data: {
        purchase: purchase[0],
        message: 'Payment completed successfully',
        walletBalance: {
          points: user.wallet,
          rupees: pointsToRupees(user.wallet)
        }
      }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return next(error);
  } finally {
    session.endSession();
  }
});

exports.getPaymentHistory = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const { page = 1, limit = 10 } = req.query;

  const purchases = await Purchase.find({ user: new mongoose.Types.ObjectId(userId) })
    .populate({
      path: 'application',
      populate: {
        path: 'course',
        populate: 'university'
      }
    })
    .sort('-createdAt')
    .limit(limit * 1)
    .skip((page - 1) * limit);


  const total = await Purchase.countDocuments({ user: userId });

  res.status(200).json({
    status: 'success',
    data: {
      purchases,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    }
  });
});

exports.getAllPayments = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    status = '',
    paymentMethod = '',
    userId = '',
    applicationId = '',
    startDate = '',
    endDate = '',
    minAmount = '',
    maxAmount = '',
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build filter object
  const filter = {};

  if (search) {
    filter.$or = [
      { transactionId: { $regex: search, $options: 'i' } },
      { refId: { $regex: search, $options: 'i' } },
      { couponCode: { $regex: search, $options: 'i' } }
    ];
  }

  if (status) filter.status = status;
  if (paymentMethod) filter.paymentMethod = paymentMethod;
  if (userId) filter.user = new mongoose.Types.ObjectId(userId);
  if (applicationId) filter.application = new mongoose.Types.ObjectId(applicationId);

  // Date range filter
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  // Amount range filter
  if (minAmount || maxAmount) {
    filter.amount = {};
    if (minAmount) filter.amount.$gte = Number(minAmount);
    if (maxAmount) filter.amount.$lte = Number(maxAmount);
  }

  // Pagination
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  // Sorting
  const sortObj = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

  // Execute query with population
  const [payments, total] = await Promise.all([
    Purchase.find(filter)
      .populate({
        path: 'user',
        select: 'name email phone'
      })
      .populate({
        path: 'application',
        populate: [
          { path: 'student', select: 'name email' },
          { path: 'course', populate: { path: 'university', select: 'name uni_logo' } }
        ]
      })
      .sort(sortObj)
      .limit(limitNum)
      .skip(skip)
      .lean(),
    Purchase.countDocuments(filter)
  ]);

  res.status(200).json({
    success: true,
    data: payments,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }
  });
});

exports.getPaymentStats = catchAsync(async (req, res, next) => {
  const { startDate, endDate } = req.query;

  // Build date filter
  const dateFilter = {};
  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
    if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
  }

  // Base aggregation pipeline
  const baseMatch = Object.keys(dateFilter).length ? { $match: dateFilter } : {};

  const stats = await Purchase.aggregate([
    ...Object.keys(baseMatch).length ? [baseMatch] : [],
    {
      $group: {
        _id: null,
        totalTransactions: { $sum: 1 },
        totalRevenue: { $sum: '$amount' },
        totalGst: { $sum: '$gst' },
        totalDiscount: { $sum: '$couponDiscount' },
        completedCount: {
          $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
        },
        pendingCount: {
          $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] }
        },
        cancelledCount: {
          $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] }
        },
        refundedCount: {
          $sum: { $cond: [{ $eq: ['$status', 'Refunded'] }, 1, 0] }
        },
        walletUsedCount: {
          $sum: { $cond: [{ $eq: ['$isWalletUsed', true] }, 1, 0] }
        },
        avgTransactionValue: { $avg: '$amount' }
      }
    }
  ]);

  // Payment method breakdown
  const paymentMethodStats = await Purchase.aggregate([
    ...Object.keys(baseMatch).length ? [baseMatch] : [],
    { $match: { status: 'Completed' } },
    {
      $group: {
        _id: '$paymentMethod',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    },
    { $sort: { totalAmount: -1 } }
  ]);

  // Status timeline (last 7 days)
  const timelineStats = await Purchase.aggregate([
    ...Object.keys(baseMatch).length ? [baseMatch] : [],
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
        revenue: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, '$amount', 0] } }
      }
    },
    { $sort: { _id: 1 } },
    { $limit: 7 }
  ]);

  res.status(200).json({
    success: true,
    data: {
      overview: stats[0] || {
        totalTransactions: 0,
        totalRevenue: 0,
        totalGst: 0,
        totalDiscount: 0,
        completedCount: 0,
        pendingCount: 0,
        cancelledCount: 0,
        refundedCount: 0,
        walletUsedCount: 0,
        avgTransactionValue: 0
      },
      paymentMethods: paymentMethodStats,
      timeline: timelineStats
    }
  });
});

exports.getPaymentDetails = catchAsync(async (req, res, next) => {
  const { purchaseId } = req.params;

  const purchase = await Purchase.findById(purchaseId)
    .populate({
      path: 'user',
      select: 'name email phone wallet'
    })
    .populate({
      path: 'application',
      populate: [
        { path: 'student', select: 'name email phone' },
        { path: 'course', populate: { path: 'university' } },
        { path: 'country' }
      ]
    });

  if (!purchase) {
    return res.status(404).json({
      success: false,
      message: 'Purchase record not found'
    });
  }

  res.status(200).json({
    success: true,
    data: purchase
  });
});