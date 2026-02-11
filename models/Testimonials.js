const mongoose = require('mongoose')

const testimonialSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    videoUrl:{
      type: String,
      trim: true,
    },
    type:{
      type: String,
      trim: true,
    },
    university: {
      type: String,
      trim: true,
    },
    universityLogo: {
      type: String,
      trim: true,
    },
    designation: {
      type: String,
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Testimonial message is required'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5,
    },
    target: {
      type: String,
      trim: true,
    },
    image: {
      type: String, // image URL or path
      trim: true,
    },
    source: {
      type: String, // Website, Google, Facebook, Manual, etc.
      trim: true,
    },
    content:{
      type: String,
      trim: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    metaDetails:{
      type: mongoose.Schema.Types.Mixed,
      default: {},
    }
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model('Testimonial', testimonialSchema)