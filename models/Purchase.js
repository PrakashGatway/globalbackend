const mongoose = require('mongoose')

const purchaseSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
    },
    program: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Program',
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['Pending', 'Completed', 'Cancelled', 'Refunded'],
      default: 'Pending',
    },
    paymentMethod: {
      type: String,
      enum: ['Credit Card', 'Debit Card', 'UPI', 'Wallet', 'Bank Transfer'],
    },
    transactionId: {
      type: String,
    },
    rewardsEarned: {
      cashback: {
        type: Number,
        default: 0,
      },
      points: {
        type: Number,
        default: 0,
      },
    },
    couponCode: {
      type: String,
      default: '',
    },
    couponDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },
    originalAmount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
)

// Validation: Either course or program must be provided
purchaseSchema.pre('validate', function (next) {
  if (!this.course && !this.program) {
    next(new Error('Either course or program must be provided'))
  } else {
    next()
  }
})

// Index for faster queries
purchaseSchema.index({ student: 1, course: 1 })
purchaseSchema.index({ student: 1, program: 1 })
purchaseSchema.index({ student: 1, createdAt: -1 })

module.exports = mongoose.model('Purchase', purchaseSchema)
