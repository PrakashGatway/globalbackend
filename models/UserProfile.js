const mongoose = require('mongoose')

const documentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        'passport',
        'resume',
        'marksheet',
        'degree_certificate',
        'ielts',
        'toefl',
        'pte',
        'lor',
        'sop',
        'offer_letter',
        'visa'
      ],
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileName: String,
    verified: {
      type: Boolean,
      default: false,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
)

const educationSchema = new mongoose.Schema(
  {
    level: {
      type: String,
      enum: ['10th', '12th', 'diploma', 'bachelor', 'master'],
    },
    institution: String,
    boardOrUniversity: String,
    country: String,
    passingYear: Number,
    score: String, // percentage / CGPA
  },
  { _id: false }
)

const addressSchema = new mongoose.Schema(
  {
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
  },
  { _id: false }
)

const userProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    currentAddress: addressSchema,
    permanentAddress: addressSchema,
    educationHistory: [educationSchema],
    preferredCountries: [String],
    preferredIntake: String, // Fall 2025, Spring 2026
    preferredCourse: String,
    budgetRange: {
      min: Number,
      max: Number,
    },
    englishTest: {
      exam: {
        type: String,
        enum: ['IELTS', 'TOEFL', 'PTE', 'Duolingo'],
      },
      score: String,
      examDate: Date,
    },
    documents: [documentSchema],
    visaStatus: {
      type: String,
      enum: ['not_applied', 'applied', 'approved', 'rejected'],
      default: 'not_applied',
    },
    profileCompletion: {
      type: Number,
      default: 0,
    },
    notes: String,
    otherDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: '',
    }
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model('UserProfile', userProfileSchema)
