const mongoose = require('mongoose')

const countrySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide country name'],
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Please provide country code'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    currency: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
    universities: {
      type: Number,
      default: 0,
    },
    students: {
      type: Number,
      default: 0,
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

module.exports = mongoose.model('Country', countrySchema)
