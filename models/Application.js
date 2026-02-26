const mongoose = require('mongoose')

const applicationSchema = new mongoose.Schema(
  {
    applicationNumber: {
      type: String,
      unique: true,
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    country: {
      type: String,
      required: true,
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
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Completed', 'Failed'],
      default: 'Pending',
    },
    expectations: {
      understood: {
        type: Boolean
      },
      agreed: {
        type: Boolean
      }
    },
    documents: [
      {
        name: String,
        description: String,
        docUrl: String,
        docType: String
      }
    ],
    OoshasDocuments: [
      {
        name: String,
        description: String,
        docUrl: String,
        docType: String
      }
    ],
    extraRequirements: {
      type:mongoose.Schema.Types.Mixed
    },
    backups: [
      {
        course: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Course',
        },
        intake: String,
        order: Number
      }
    ],
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
    isWithdrawn: {
      type: Boolean,
      default: false,
    },
    userNotes: String,
    adminNotes: String,
  },
  {
    timestamps: true,
  }
)

applicationSchema.index({ student: 1 })
applicationSchema.index({ applicationNumber: 1 })

module.exports = mongoose.model('Application', applicationSchema)
