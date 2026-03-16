const mongoose = require("mongoose");

const educationSchema = new mongoose.Schema({
  examPassed: {
    type: String,
    enum: [
      "10th Grade",
      "12th Grade",
      "Bachelors Degree",
      "Masters Degree",
      "Doctorates",
      "Other"
    ]
  },
  schoolName: String,
  yearOfPassing: Number,
  marks: Number,
  subject: String
});

const experienceSchema = new mongoose.Schema({
  from: Date,
  to: Date,
  companyName: {
    type : String,
    default : "Gateway Abroad Education"
  },
  designation: String,
  totalExperience: Number
});

const studyAbroadSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },

  preferences: {
    preference1: String,
    preference2: String,
    preference3: String,
    preference4: String
  },

  countryChoice: {
    type: String,
    enum: [
      "UK",
      "USA",
      "Canada",
      "Ireland",
      "Dubai",
      "Australia",
      "Singapore",
      "Switzerland",
      "New Zealand",
      "EUROPE",
      "Other"
    ]
  },

  personalDetails: {
    name: {
      type: String,
      required: true
    },

    fatherName: String,

    dateOfBirth: {
      type: Date
    },

    age: Number,

    email: {
      type: String,
      match: /^\S+@\S+\.\S+$/
    },

    mobile: {
      type: String,
      required: true
    },

    maritalStatus: {
      type: String,
      enum: ["Single", "Married"]
    },

    address: String,

    parentAnnualIncome: Number,

    parentOccupation: String,

    budget: Number
  },

  interest: {
    course: String,
    intake: String,
    levelOfStudy: {
      type: String,
      enum: ["Bachelors", "Masters"]
    },
    universityInterest: String
  },

  experience: experienceSchema,

  educationFrom: {
    type: String,
    enum: ["CBSC", "IB", "State Board"]
  },

  education: [educationSchema],

  testGiven: {
    IELTS: Boolean,
    TOEFL: Boolean,
    PTE: Boolean,
    GRE: Boolean,
    GMAT: Boolean,
    SAT: Boolean,
    OET: Boolean,
    spokenEnglish: Boolean
  },

  score: String,

  heardAboutUs: {
    type: String,
    enum: ["Internet", "Advertisement", "Friend", "Counsellor", "Other"]
  }
}, { timestamps: true });

module.exports = mongoose.model("Enquiry", studyAbroadSchema);