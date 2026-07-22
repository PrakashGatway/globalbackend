const mongoose = require('mongoose');

const scholarshipSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      
    },
    shortDescription: {
      type: String,
      trim: true,
      minlength: [0, "Description must be at least 0 characters"],
      maxlength: [500, "Description cannot exceed 500 characters"]
    },
    
    seoTitle: {
      type: String,
      required: true,
      trim: true,
    },
    
    seoDescription: {
      type: String,
      required: true,
    },
    
    seoKeyword: {
      type: String,
      required: true,
    },
    cover_photo: {
      type: String,
      trim: true,
    },
    subjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true,
      }
    ],
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    country: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Country',
      required: true,
    },
    extra_content: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CountryExtradetails',
      required: true,
      unique: true,
    },
    // university: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: 'University',
    //   default: null
    // },
    level: {
      type: [String], // e.g., ['Undergraduate', 'Postgraduate']
      required: true,
    },
    fundingType: {
      type: String, // e.g., 'Fee waiver/discount', 'Stipend', 'Loan'
      trim: true,
    },
    studyMode: {
      type: String, // e.g., 'Full-time', 'Part-time'
      trim: true,
    },
    deliveryMode: {
      type: String, // e.g., 'Online', 'Offline'
      trim: true,
    },
    amount: {
      type: String, // e.g., '25%', '$5000 PA', 'Full tuition'
      trim: true,
    },
    valueDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    eligibilityCriteria: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    benefits: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    exclusionCriteria: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    selectionBasis: {
      type: String, // e.g., 'Academic excellence', 'Merit-based'
      trim: true,
    },
    deadline: {
      type: String,
      trim: true,
    },
    intake: {
      type: String,
      trim: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
    howToApply: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    metaData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Scholarship', scholarshipSchema);
