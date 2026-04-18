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

// Get payment details
exports.getPaymentDetails = catchAsync(async (req, res, next) => {
  const { purchaseId } = req.params;
  const userId = req.user.id;

  const purchase = await Purchase.findOne({
    _id: purchaseId,
    user: userId
  }).populate({
    path: 'application',
    populate: {
      path: 'course',
      populate: 'university'
    }
  });

  if (!purchase) {
    return next(new AppError('Purchase not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { purchase }
  });
});