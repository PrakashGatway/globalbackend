const mongoose = require('mongoose')

const universitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide university name'],
      trim: true,
    },
    country: {
      type: String,
      required: [true, 'Please provide country'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'Please provide city'],
      trim: true,
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

module.exports = mongoose.model('University', universitySchema)
