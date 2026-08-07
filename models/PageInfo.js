const mongoose = require('mongoose')

const pageInformationSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true },
    subTitle: { type: String, trim: true },
    isNavbar: { type: Boolean, default: false },
    navbarTitle: { type: String, trim: true },
    description: { type: String, trim: true },
    pageType: { type: String, trim: true, required: true },
    cardImage: {
      type: String,
      trim: true,
    },
    navbarImage: {
      type: String,
      trim: true,
    },
    country: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Country',
      default: null,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    status: {
      type: String,
      enum: ['Draft', 'Published'],
      default: 'Draft',
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isFooter: {
      type: Boolean,
      default: false,
    },
    seoMeta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    city:{
      type : String
    },
    state : {
      type : String
    },
    isCity: {
      type : String,
      default: "No"
    },
    sections: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    extraDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
)

pageInformationSchema.index({ slug: 1 , pageType: 1}, { unique: true})

module.exports = mongoose.model('PageInformation', pageInformationSchema)
