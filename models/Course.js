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
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CourseCategory',
      required: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      trim: true,
      default: null,
    },
    studyMode: {
      type: String,
      required: [true, 'Please provide study mode'],
      trim: true,
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
    currency: {
      type: String,
      required: true,
    },
    level: {
      type: String,
      required: true,
    },
    tags: {
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
    description: {
      type: String,
      trim: true,
    },
    requirements: {
      type: mongoose.Schema.Types.Mixed,
      trim: true,
    },
    docsRequired: {
      type: mongoose.Schema.Types.Mixed,
      trim: true,
    },
    extra_content: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'extraContent',
      required: true,
    },
    metaInfo:{
      type: mongoose.Schema.Types.Mixed,
      trim: true
    },
    seoData: {
      type: mongoose.Schema.Types.Mixed,
      trim: true,
    }
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model('Course', courseSchema)
