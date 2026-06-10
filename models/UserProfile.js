const mongoose = require('mongoose')

const educationSchema = new mongoose.Schema(
  {
    educationLevel: {
      type: String,
    },
    institutionName: String,
    gradingScheme: String,
    percentage: Number,
    startDate: Date,
    endDate: Date,
    degreeName: String,
    city: String,
    state: String,
    country: String
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
      "highestEducationLevel": String
    },
    educationHistory: [educationSchema],
    workExperience: [{
      "companyName": String,
      "designation": String,
      "location": String,
      "from": Date,
      "to": Date
    }],
    ielts: {
      type: String,
      default: '',
      set: function (value) {
        return JSON.stringify(value);
      }
    },
    toefl: {
      type: String,
      default: '',
      set: function (value) {
        return JSON.stringify(value);
      }
    },
    gre: {
      type: String,
      default: '',
      set: function (value) {
        return JSON.stringify(value);
      }
    },
    sat: {
      type: String,
      default: '',
      set: function (value) {
        return JSON.stringify(value);
      }
    },
    gmat: {
      type: String,
      default: '',
      set: function (value) {
        return JSON.stringify(value);
      }
    },
    pte: {
      type: String,
      default: '',
      set: function (value) {
        return JSON.stringify(value);
      }
    },
    preferences: {
      preferredCountries: [String],
      preferredIntake: [String],
      preferredCourse: [String],
      budgetRange: {
        min: Number,
        max: Number,
      },
      level: String
    },
    documents: {
      type: String,
      default: '',
      set: function (value) {
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
