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
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
      default: 'Open',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },
    description: {
      type: String,
      required: true,
    },
    resolution: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
)

// Generate ticket number before saving
supportSchema.pre('save', async function (next) {
  if (!this.ticketNumber) {
    const count = await mongoose.model('Support').countDocuments()
    this.ticketNumber = `TKT-${String(count + 1).padStart(3, '0')}`
  }
  next()
})

module.exports = mongoose.model('Support', supportSchema)
