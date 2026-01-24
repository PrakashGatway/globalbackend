const Purchase = require('../models/Purchase')
const Course = require('../models/Course')
const Program = require('../models/Program')
const Reward = require('../models/Reward')
const User = require('../models/User')
const Coupon = require('../models/Coupon')
const { paginate } = require('../utils/pagination')

// @desc    Purchase a course
// @route   POST /api/purchases
// @access  Private (Student only)
exports.purchaseCourse = async (req, res) => {
  try {
    const { courseId, programId, paymentMethod, transactionId, couponCode } = req.body
    const studentId = req.user._id

    // Validate that either courseId or programId is provided
    if (!courseId && !programId) {
      return res.status(400).json({
        success: false,
        message: 'Either courseId or programId is required',
      })
    }

    if (courseId && programId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide either courseId or programId, not both',
      })
    }

    // Check if user is a student
    const user = await User.findById(studentId)
    if (!user || user.role !== 'user') {
      return res.status(403).json({
        success: false,
        message: 'Only students can purchase courses',
      })
    }

    // Get item (course or program)
    let item = null
    let itemType = null
    let itemId = null

    if (courseId) {
      item = await Course.findById(courseId)
      itemType = 'course'
      itemId = courseId
    } else if (programId) {
      item = await Program.findById(programId)
      itemType = 'program'
      itemId = programId
    }

    if (!item) {
      return res.status(404).json({
        success: false,
        message: itemType === 'course' ? 'Course not found' : 'Program not found',
      })
    }

    if (item.status !== 'Active') {
      return res.status(400).json({
        success: false,
        message: `${itemType === 'course' ? 'Course' : 'Program'} is not available for purchase`,
      })
    }

    // Check if student already purchased this item
    const existingPurchase = await Purchase.findOne({
      student: studentId,
      [itemType === 'course' ? 'course' : 'program']: itemId,
      status: 'Completed',
    })

    if (existingPurchase) {
      return res.status(400).json({
        success: false,
        message: `You have already purchased this ${itemType === 'course' ? 'course' : 'program'}`,
      })
    }

    const originalAmount = item.price || 0
    let purchaseAmount = originalAmount
    let couponDiscount = 0
    let appliedCoupon = null

    // Validate and apply coupon if provided
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() })

      if (!coupon) {
        return res.status(400).json({
          success: false,
          message: 'Invalid coupon code',
        })
      }

      // Check if coupon is applicable
      if (coupon.applicableTo === 'courses' && itemType !== 'course') {
        return res.status(400).json({
          success: false,
          message: 'This coupon is only applicable to courses',
        })
      }

      if (coupon.applicableTo === 'programs' && itemType !== 'program') {
        return res.status(400).json({
          success: false,
          message: 'This coupon is only applicable to programs',
        })
      }

      // Validate coupon
      const validation = coupon.isValid(originalAmount, itemId)

      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: validation.message,
        })
      }

      // Calculate discount
      couponDiscount = coupon.calculateDiscount(originalAmount)
      purchaseAmount = originalAmount - couponDiscount

      // Increment coupon usage
      coupon.usedCount += 1
      await coupon.save()

      appliedCoupon = {
        code: coupon.code,
        discount: couponDiscount,
      }
    }

    // Calculate rewards: 10% cashback
    const cashbackAmount = (purchaseAmount * 10) / 100

    // Calculate points: up to 500 points per purchase
    // Points are calculated as 10% of purchase amount in points, capped at 500 points
    // Example: ₹1000 purchase = 100 points, ₹5000 purchase = 500 points (capped)
    const pointsEarned = Math.min(Math.floor((purchaseAmount * 10) / 100), 500)

    // Create purchase record
    const purchaseData = {
      student: studentId,
      amount: purchaseAmount,
      originalAmount: originalAmount,
      status: 'Completed',
      paymentMethod: paymentMethod || 'Credit Card',
      transactionId: transactionId || `TXN${Date.now()}`,
      rewardsEarned: {
        cashback: cashbackAmount,
        points: pointsEarned,
      },
    }

    if (courseId) {
      purchaseData.course = courseId
    } else if (programId) {
      purchaseData.program = programId
    }

    if (appliedCoupon) {
      purchaseData.couponCode = appliedCoupon.code
      purchaseData.couponDiscount = couponDiscount
    }

    const purchase = await Purchase.create(purchaseData)

    // Update or create reward record for the student
    let reward = await Reward.findOne({ user: studentId })

    if (!reward) {
      // Create new reward record
      reward = await Reward.create({
        user: studentId,
        points: pointsEarned,
        cashback: cashbackAmount,
        totalEarned: {
          points: pointsEarned,
          cashback: cashbackAmount,
        },
      })
    } else {
      // Update existing reward record
      reward.points += pointsEarned
      reward.cashback += cashbackAmount
      reward.totalEarned.points += pointsEarned
      reward.totalEarned.cashback += cashbackAmount
      await reward.save()
    }

    // Update item student count
    item.students += 1
    await item.save()

    res.status(201).json({
      success: true,
      message: `${itemType === 'course' ? 'Course' : 'Program'} purchased successfully`,
      data: {
        purchase: {
          id: purchase._id,
          itemName: item.name,
          itemType: itemType,
          originalAmount: originalAmount,
          amount: purchaseAmount,
          couponDiscount: couponDiscount,
          couponCode: appliedCoupon?.code || null,
          status: purchase.status,
          rewardsEarned: {
            cashback: cashbackAmount,
            points: pointsEarned,
          },
        },
        rewards: {
          totalPoints: reward.points,
          totalCashback: reward.cashback,
        },
      },
    })
  } catch (error) {
    console.error('Purchase error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Get all purchases
// @route   GET /api/purchases
// @access  Private
exports.getPurchases = async (req, res) => {
  try {
    const { data, pagination } = await paginate(
      Purchase,
      {},
      req,
      {
        populate: [
          { path: 'student', select: 'name email' },
          { path: 'course', select: 'name code price' },
        ],
        sort: { createdAt: -1 },
      }
    )

    res.json({
      success: true,
      count: pagination.totalItems,
      pagination,
      data,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Get student's purchases
// @route   GET /api/purchases/my-purchases
// @access  Private
exports.getMyPurchases = async (req, res) => {
  try {
    const studentId = req.user._id

    const { data, pagination } = await paginate(
      Purchase,
      { student: studentId },
      req,
      {
        populate: { path: 'course', select: 'name code price description university' },
        sort: { createdAt: -1 },
      }
    )

    res.json({
      success: true,
      count: pagination.totalItems,
      pagination,
      data,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Get single purchase
// @route   GET /api/purchases/:id
// @access  Private
exports.getPurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate('student', 'name email')
      .populate('course', 'name code price description university')

    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase not found' })
    }

    // Check if user has access (student can only see their own, admin/manager can see all)
    if (
      req.user.role === 'user' &&
      purchase.student._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      })
    }

    res.json({ success: true, data: purchase })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
