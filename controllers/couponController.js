const Coupon = require('../models/Coupon')
const { paginate } = require('../utils/pagination')

// @desc    Get all coupons
// @route   GET /api/coupons
// @access  Private
exports.getCoupons = async (req, res) => {
  try {
    const { data, pagination } = await paginate(Coupon, {}, req, {
      sort: { createdAt: -1 },
    })

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

// @desc    Get single coupon
// @route   GET /api/coupons/:id
// @access  Private
exports.getCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id)

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' })
    }

    res.json({ success: true, data: coupon })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Validate coupon code
// @route   POST /api/coupons/validate
// @access  Private
exports.validateCoupon = async (req, res) => {
  try {
    const { code, amount, itemId, itemType } = req.body

    if (!code) {
      return res.status(400).json({ success: false, message: 'Coupon code is required' })
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase() })

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid coupon code' })
    }

    // Check if coupon is applicable to the item type
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
    const validation = coupon.isValid(amount || 0, itemId)

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      })
    }

    // Calculate discount
    const discount = coupon.calculateDiscount(amount || 0)
    const finalAmount = amount - discount

    res.json({
      success: true,
      data: {
        coupon: {
          id: coupon._id,
          code: coupon.code,
          description: coupon.description,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
        },
        discount,
        originalAmount: amount,
        finalAmount: finalAmount,
      },
    })
  } catch (error) {
    console.error('Validate coupon error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Create coupon
// @route   POST /api/coupons
// @access  Private/Admin
exports.createCoupon = async (req, res) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      minPurchaseAmount,
      maxDiscountAmount,
      validFrom,
      validTo,
      usageLimit,
      applicableTo,
      applicableItems,
    } = req.body

    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() })
    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code already exists',
      })
    }

    // Validate dates
    const fromDate = validFrom ? new Date(validFrom) : new Date()
    const toDate = validTo ? new Date(validTo) : null

    if (toDate && toDate <= fromDate) {
      return res.status(400).json({
        success: false,
        message: 'Valid to date must be after valid from date',
      })
    }

    // Determine applicableToModel based on applicableTo
    let applicableToModel = null
    if (applicableTo === 'courses') {
      applicableToModel = 'Course'
    } else if (applicableTo === 'programs') {
      applicableToModel = 'Program'
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      description,
      discountType,
      discountValue,
      minPurchaseAmount: minPurchaseAmount || 0,
      maxDiscountAmount: maxDiscountAmount || null,
      validFrom: fromDate,
      validTo: toDate,
      usageLimit: usageLimit || null,
      applicableTo: applicableTo || 'all',
      applicableItems: applicableItems || [],
      applicableToModel,
      createdBy: req.user._id,
    })

    res.status(201).json({
      success: true,
      message: 'Coupon created successfully',
      data: coupon,
    })
  } catch (error) {
    console.error('Create coupon error:', error)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code already exists',
      })
    }
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Update coupon
// @route   PUT /api/coupons/:id
// @access  Private/Admin
exports.updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id)

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' })
    }

    // If code is being updated, check for duplicates
    if (req.body.code && req.body.code.toUpperCase() !== coupon.code) {
      const existingCoupon = await Coupon.findOne({
        code: req.body.code.toUpperCase(),
      })
      if (existingCoupon) {
        return res.status(400).json({
          success: false,
          message: 'Coupon code already exists',
        })
      }
      req.body.code = req.body.code.toUpperCase()
    }

    // Update applicableToModel if applicableTo is changed
    if (req.body.applicableTo) {
      if (req.body.applicableTo === 'courses') {
        req.body.applicableToModel = 'Course'
      } else if (req.body.applicableTo === 'programs') {
        req.body.applicableToModel = 'Program'
      } else {
        req.body.applicableToModel = null
      }
    }

    const updatedCoupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })

    res.json({
      success: true,
      message: 'Coupon updated successfully',
      data: updatedCoupon,
    })
  } catch (error) {
    console.error('Update coupon error:', error)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code already exists',
      })
    }
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Delete coupon
// @route   DELETE /api/coupons/:id
// @access  Private/Admin
exports.deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id)

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' })
    }

    res.json({
      success: true,
      message: 'Coupon deleted successfully',
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Increment coupon usage
// @route   PUT /api/coupons/:id/increment-usage
// @access  Private
exports.incrementUsage = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id)

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' })
    }

    coupon.usedCount += 1
    await coupon.save()

    res.json({
      success: true,
      message: 'Coupon usage incremented',
      data: coupon,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
