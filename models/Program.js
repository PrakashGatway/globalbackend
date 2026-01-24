const mongoose = require('mongoose')

const programSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide program name'],
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['Undergraduate', 'Graduate', 'Doctorate', 'Certificate'],
    },
    university: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'University',
      required: true,
    },
    duration: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
    students: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
    },
    image: {
      type: String,
      default: '',
    },
    imagePublicId: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model('Program', programSchema)
