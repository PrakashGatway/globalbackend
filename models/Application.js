const mongoose = require('mongoose')

const applicationSchema = new mongoose.Schema(
  {
    camsId: {
      type: String,
      required: [true, 'Please provide CAMS ID'],
      unique: true,
      trim: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    studentName: {
      type: String,
      required: [true, 'Please provide student name'],
      trim: true,
    },
    passportNo: {
      type: String,
      required: [true, 'Please provide passport number'],
      trim: true,
    },
    studentId: {
      type: String,
      required: [true, 'Please provide student ID'],
      trim: true,
    },
    university: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'University',
      required: true,
    },
    urmDetails: {
      name: {
        type: String,
        required: [true, 'Please provide URM name'],
        trim: true,
      },
      phone: {
        type: String,
        required: [true, 'Please provide URM phone'],
        trim: true,
      },
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    intake: {
      type: String,
      required: [true, 'Please provide intake'],
      trim: true,
    },
    primaryStatus: {
      type: String,
      enum: [
        'Pending',
        'Under Review',
        'Offer Received',
        'Case Closed',
        'Application Refused',
        'Withdrawn',
      ],
      default: 'Pending',
    },
    secondaryStatus: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Archived'],
      default: 'Active',
    },
  },
  {
    timestamps: true,
  }
)

// Index for faster queries
applicationSchema.index({ camsId: 1 })
applicationSchema.index({ student: 1 })
applicationSchema.index({ university: 1 })
applicationSchema.index({ course: 1 })
applicationSchema.index({ primaryStatus: 1 })
applicationSchema.index({ createdAt: -1 })
applicationSchema.index({ updatedAt: -1 })

module.exports = mongoose.model('Application', applicationSchema)
