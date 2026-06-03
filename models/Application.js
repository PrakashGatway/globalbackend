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
    documents:
    //  {
    //   type : mongoose.Schema.Types.Mixed,
    //   default : []
    // },
     [
      {
        type: {
          type: String,
          enum: ['ooshas', 'user'],
          default: 'user'
        },
        name: String,
        description: String,
        status: {
          type: String,
          enum: ['Pending', 'inreview', 'Approved', 'Rejected'],
          default: 'Pending',
        },
        required: {
          type: String,
          enum: ['required', 'optional'],
        },
        extra: {
          type: mongoose.Schema.Types.Mixed
        },
        answer: String,
        rejectReason: String,
        docUrl: String,
        docType: String
      }
    ],
    extraRequirements: {
      type: mongoose.Schema.Types.Mixed
    },
    rejectionReason: [
      {
        course: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Course',
        },
        reason: String
      }
    ],
    
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
        'Started',
        'ReviewbyOoshas',
        'SubmitToSchool',
        'AwaitingSchoolResponse',
        'AdmissionProcessing',
        'OfferReceived',
        'Refused',
        'VisaProcessing',
        'Withdrawn',
        'PreArrival',
        'Arrived',
        'Completed',
      ],
      default: 'Pending',
    },
    isWithdrawn: {
      type: Boolean,
      default: false,
    },
    userNotes: String,
    adminNotes: String,
    isVisashortlist : {
      type : Boolean,
      default: false
    }
  },
  {
    timestamps: true,
  }
)

applicationSchema.index({ student: 1 })
applicationSchema.index({ applicationNumber: 1 })

applicationSchema.path('backups').validate(function (value) {
  const seen = new Set();

  for (const item of value) {
    const key = `${item.course}-${item.intake}`;
    if (seen.has(key)) return false;
    seen.add(key);
  }

  return true;
}, 'Duplicate course + intake found in backups');

module.exports = mongoose.model('Application', applicationSchema)
