const mongoose = require('mongoose')

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Please provide coupon code'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
      default: 'percentage',
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    minPurchaseAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxDiscountAmount: {
      type: Number,
      default: null, // null means no limit
      min: 0,
    },
    validFrom: {
      type: Date,
      required: true,
      default: Date.now,
    },
    validTo: {
      type: Date,
      required: true,
    },
    usageLimit: {
      type: Number,
      default: null, // null means unlimited
      min: 1,
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    applicableTo: {
      type: String,
      enum: ['all', 'courses', 'programs'],
      default: 'all',
    },
    applicableItems: [
      {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'applicableToModel',
      },
    ],
    applicableToModel: {
      type: String,
      enum: ['Course', 'Program'],
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Expired'],
      default: 'Active',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
)

// Index for faster queries
couponSchema.index({ code: 1 })
couponSchema.index({ status: 1, validFrom: 1, validTo: 1 })

// Method to check if coupon is valid
couponSchema.methods.isValid = function (amount = 0, itemId = null) {
  const now = new Date()

  // Check status
  if (this.status !== 'Active') {
    return { valid: false, message: 'Coupon is not active' }
  }

  // Check validity dates
  if (now < this.validFrom) {
    return { valid: false, message: 'Coupon is not yet valid' }
  }

  if (now > this.validTo) {
    return { valid: false, message: 'Coupon has expired' }
  }

  // Check usage limit
  if (this.usageLimit && this.usedCount >= this.usageLimit) {
    return { valid: false, message: 'Coupon usage limit reached' }
  }

  // Check minimum purchase amount
  if (amount < this.minPurchaseAmount) {
    return {
      valid: false,
      message: `Minimum purchase amount of ₹${this.minPurchaseAmount} required`,
    }
  }

  // Check if applicable to specific items
  if (this.applicableTo === 'courses' || this.applicableTo === 'programs') {
    if (this.applicableItems.length > 0 && itemId) {
      const itemIdStr = itemId.toString()
      const applicableIds = this.applicableItems.map((id) => id.toString())
      if (!applicableIds.includes(itemIdStr)) {
        return { valid: false, message: 'Coupon not applicable to this item' }
      }
    }
  }

  return { valid: true }
}

// Method to calculate discount
couponSchema.methods.calculateDiscount = function (amount) {
  let discount = 0

  if (this.discountType === 'percentage') {
    discount = (amount * this.discountValue) / 100
    // Apply max discount limit if set
    if (this.maxDiscountAmount && discount > this.maxDiscountAmount) {
      discount = this.maxDiscountAmount
    }
  } else if (this.discountType === 'fixed') {
    discount = this.discountValue
    // Don't allow discount more than purchase amount
    if (discount > amount) {
      discount = amount
    }
  }

  return Math.round(discount * 100) / 100 // Round to 2 decimal places
}

module.exports = mongoose.model('Coupon', couponSchema)
