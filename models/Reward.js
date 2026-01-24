const mongoose = require('mongoose')

const rewardSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    points: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    cashback: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    totalEarned: {
      points: {
        type: Number,
        default: 0,
      },
      cashback: {
        type: Number,
        default: 0,
      },
    },
    totalRedeemed: {
      points: {
        type: Number,
        default: 0,
      },
      cashback: {
        type: Number,
        default: 0,
      },
    },
    // Conversion rate: 500 points = 10-100rs (variable)
    // We'll store the conversion rate per point in rupees
    pointToRupeeRate: {
      type: Number,
      default: 0.02, // Default: 1 point = 0.02rs, so 500 points = 10rs
      min: 0.02, // Minimum: 500 points = 10rs
      max: 0.2, // Maximum: 500 points = 100rs
    },
  },
  {
    timestamps: true,
  }
)

// Index for faster queries
rewardSchema.index({ user: 1 })

module.exports = mongoose.model('Reward', rewardSchema)
