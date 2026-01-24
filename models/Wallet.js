const mongoose = require('mongoose')

const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    balance: {
      type: Number,
      required: true,
      default: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'INR'],
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Frozen'],
      default: 'Active',
    },
    lastTransaction: {
      type: Date,
      default: Date.now,
    },
    transactionType: {
      type: String,
      enum: ['Credit', 'Debit'],
    },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model('Wallet', walletSchema)
