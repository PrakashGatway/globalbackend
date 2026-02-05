const mongoose = require('mongoose')

const courseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide course name'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Please provide course slug'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    university: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'University',
      required: true,
    },
    shortName: {
      type: String,
      trim: true,
    },
    tuitionFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    level: {
      type: String,
      required: true,
    },
    tags:{
      type: [String],
      required: true,
    },
    applicationFee: {
      type: Number,
      default: 0,
      min: 0,
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
    price: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
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

module.exports = mongoose.model('Course', courseSchema)
