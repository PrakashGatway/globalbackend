const mongoose = require('mongoose')
const { Schema } = mongoose;

const couponSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['coupon', 'reward'],
      required: true,
      default: 'coupon',
    },
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
    title: {
      type: String,
      default: '',
    },
    couponData: {
      discountType: {
        type: String,
        enum: ['percentage', 'fixed'],
        default: 'percentage',
      },
      discountValue: {
        type: Number,
        min: 0,
      },
      isUserSpecific: {
        type: Boolean,
        default: false,
      },
      users: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        }
      ],
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
        enum: ["course", "program"],
      }
    },
    rewardData: {
      rewardType: {
        type: String,
        enum: ["COUPON", "WALLET", "CASH", "NOTHING"],
      },
      rewardValue: {
        type: Number,
        default: 0
      },
      couponId: {
        type: Schema.Types.ObjectId,
        ref: "Coupon",
        default: null
      },
      probability: {
        type: Number,
        min: 0,
        max: 100
      }
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
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Expired'],
      default: 'Active',
    }
  },
  {
    timestamps: true,
  }
)

couponSchema.index({ code: 1 })
couponSchema.index({ status: 1, validFrom: 1, validTo: 1 })

const scratchCardSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  rewardId: {
    type: Schema.Types.ObjectId,
    ref: "Coupon",
    default: null
  },

  isScratched: {
    type: Boolean,
    default: false,
    index: true
  },
  scratchedAt: {
    type: Date
  },
  expiresAt: {
    type: Date,
    index: true,
    expires: 0
  }
}, {
  timestamps: true
});


const ScratchCard = mongoose.model("ScratchCard", scratchCardSchema);
const Coupon = mongoose.model('Coupon', couponSchema)

module.exports = {
  ScratchCard,
  Coupon
};