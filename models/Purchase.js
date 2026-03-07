const mongoose = require('mongoose')

const purchaseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      default: null
    },
    isService: {
      type: Boolean,
      default: false
    },
    serviceName: {
      type: String,
      default: ''
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    gst: {
      type: Number,
      default: 0,
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
    refId: {
      type: String,
      default: '',
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
    isWalletUsed: {
      type: Boolean,
      default: false
    },
    walletPointsUsed: {
      type: Number,
      default: 0
    },
    originalAmount: {
      type: Number,
      default: 0,
    },
    reason: {
      type: String,
      default: ''
    },
    refund: {
      refundId: { type: String },
      refundAmount: { type: Number },
      refundDate: { type: Date },
      reason: { type: String },
    }
  },
  {
    timestamps: true,
  }
)


purchaseSchema.index({ user: 1, createdAt: -1 })

module.exports = mongoose.model('Purchase', purchaseSchema)
