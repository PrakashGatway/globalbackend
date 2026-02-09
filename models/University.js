const mongoose = require('mongoose')

const universitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide university name'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Please provide university slug'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    slogan: {
      type: String,
      trim: true,
    },
    uni_type: {
      type: String,
      required: [true, 'Please provide university type'],
      trim: true,
    },
    intakes: {
      type: mongoose.Schema.Types.Mixed,
      default: '',
    },
    short_description: {
      type: String,
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Please provide university code'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Please provide address'],
      trim: true,
    },
    country: {
      type: String,
      required: [true, 'Please provide country'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'Please provide city'],
      trim: true,
    },
    social_links: {
      facebook: { type: String, default: '' },
      twitter: { type: String, default: '' },
      instagram: { type: String, default: '' },
      linkedin: { type: String, default: '' },
    },
    uni_logo: {
      type: String,
      default: '',
    },
    cover_photo: {
      type: String,
      default: '',
    },
    uni_web: {
      type: String,
      default: '',
    },
    uni_rank: {
      type: mongoose.Schema.Types.Mixed,
      default: '',
    },
    uni_gallery: {
      type: mongoose.Schema.Types.Mixed,
      default: "",
    },
    google_location: {
      type: mongoose.Schema.Types.Mixed,
      default: '',
    },
    uni_contact: {
      type: String,
      default: '',
    },
    established_year: {
      type: Number,
      default: null,
    },
    on_campus_accommodation: {
      type: Boolean,
      default: false,
    },
    off_campus_accommodation: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
    financials: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    location_alias: {
      type: String,
      default: '',
    },
    offers: {
      type: String,
      default: "0"
    },
    extra_content: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'extraContent',
      required: true,
      unique: true,
    },
    seo_metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    tags: {
      type: String,
      default: "",
    },
    acceptanceRate: {
      type: Number,
      default: 0,
    }
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model('University', universitySchema)
