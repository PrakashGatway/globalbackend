const mongoose = require('mongoose')

const documentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
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
  { _id: true }
)

const educationSchema = new mongoose.Schema(
  {
    educationLevel: {
      type: String,
    },
    institutionName: String,
    gradingScheme: String,
    startDate: Date,
    endDate: Date,
    degreeName: String,
    address: String,
    city: String,
    state: String,
    country: String,
    postalCode: String
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
    highestAcademic: {
      "countryOfEducation": String,
      "highestEducationLevel": String,
      "gradingScheme": String,
      "gradeAverage": String,
      "graduated": Boolean,
    },
    educationHistory: [educationSchema],
    englishProficiency: String,
    englishProficiencyTest: String,
    englishProficiencyScore: {
      "englishStatus": String,
      "englishTest": String,
      "reading": String,
      "listening": String,
      "writing": String,
      "speaking": String,
      "examDate": Date
    },
    hasGmat: {
      type: Boolean,
      default: false
    },
    hasGre: {
      type: Boolean,
      default: false
    },
    gmatScore: {
      totalScore: {
        score: Number,
        rank: Number
      },
      verbal: {
        score: Number,
        rank: Number
      },
      quantitative: {
        score: Number,
        rank: Number
      },
      analyticalWriting: {
        score: Number,
        rank: Number
      },
      examDate: Date
    },
    satScore: {
      totalScore: {
        score: Number,
        rank: Number
      },
      verbal: {
        score: Number,
        rank: Number
      },
      quantitative: {
        score: Number,
        rank: Number
      },
      analyticalWriting: {
        score: Number,
        rank: Number
      },
      examDate: Date
    },
    visaRefused: {
      type: Boolean,
      default: false
    },
    validVisas: [String],
    visaRefusedInfo: String,
    preferences: {
      preferredCountries: [String],
      preferredIntake: [String],
      preferredCourse: [String],
      budgetRange: {
        min: Number,
        max: Number,
      },
    },
    // documents: [documentSchema],
    documents: {
    type: String,
    default: '[]',
    get: function(value) {
      // Automatically parse when accessing the field
      try {
        return JSON.parse(value);
      } catch(e) {
        return [];
      }
    },
    set: function(value) {
      // Automatically stringify when setting
      return JSON.stringify(value);
    }
  },
    profileCompletion: {
      type: Number,
      default: 0,
    },
    notes: String,
    otherDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    }
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model('UserProfile', userProfileSchema)
