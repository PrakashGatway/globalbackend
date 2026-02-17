const mongoose = require('mongoose')

const supportSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
    },
    subject: {
      type: String,
      required: [true, 'Please provide subject'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Please provide category'],
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    description: {
      type: String,
    },
    email: {
      type: String
    },
    status: {
      type: String,
      enum: ['open', 'pending', 'resolved', 'closed'],
      default: 'open',
    },
    reply: {
      type: [
        {
          user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
          },
          description: {
            type: String,
          },
          createdAt: {
            type: Date,
            default: Date.now,
          },
        }
      ],
      default: []
    },
    priority: {
      type: String,
      default: 'Medium',
    },
    relatedIssue: {
      type: String,
    },
    resolution: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
)

supportSchema.pre('validate', async function (next) {
  if (!this.ticketNumber) {
    const count = await mongoose.model('Support').countDocuments()
    this.ticketNumber = `T-${String(count + 1).padStart(3, '0')}`
  }
  next()
})


module.exports = mongoose.model('Support', supportSchema)
