const mongoose = require('mongoose')

/* ---------- Image Field (url + publicId pair) ---------- */
const imageFieldSchema = new mongoose.Schema(
  {
    url: { type: String, default: null },
    publicId: { type: String, default: null },
  },
  { _id: false }
)

/* ---------- All Images grouped together ---------- */
const imagesSchema = new mongoose.Schema(
  {
    hero: imageFieldSchema,
    roadmap: imageFieldSchema,
    mobileRoadmap: imageFieldSchema,

    universityCapBg: imageFieldSchema,
    universitySliderBg: imageFieldSchema,

    immigrationServices1Bg: imageFieldSchema,
    immigrationServices2Bg: imageFieldSchema,
  },
  { _id: false }
)

/* ---------- Dynamic Sections ---------- */
const sectionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    order: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
)

/* ==================================================
   MAIN PAGE SCHEMA
================================================== */

const pageInformationSchema = new mongoose.Schema(
  {
    /* ==============================
       PAGE IDENTITY
    ============================== */
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    pageType: {
      type: String,
      default: 'home_page',
      enum: [
        'home_page',
        'about_page',
        'contact_page',
        'services_page',
        'destination_page',
        'blogs_page',
        'events_page',
        'career_page',
        'city_page',
        'ivy_league',
        'usa_universities',
        'uk_universities',
        'germany_public_universities',
        'italy_france',
        'canada_australia',
        'other',
      ],
    },

    status: {
      type: String,
      enum: ['Draft', 'Published'],
      default: 'Draft',
    },

    isFeatured: {
      type: String,
      enum: ['Yes', 'No'],
      default: 'No',
    },

    /* ==============================
       BASIC CONTENT
    ============================== */
    title: { type: String, trim: true },
    subTitle: { type: String, trim: true },
    navbarTitle: { type: String, trim: true },
    route: { type: String, trim: true },
    hasDropdown: { type: Boolean, default: false },

    /* ==============================
       SEO
    ============================== */
    metaTitle: { type: String, trim: true },
    metaDescription: { type: String, trim: true },
    canonicalUrl: { type: String, trim: true },
    keywords: { type: [String], default: [] },
    tags: { type: [String], default: [] },

    /* ==============================
       IMAGES (CLEAN GROUPED)
    ============================== */
    images: imagesSchema,

    /* ==============================
       DYNAMIC CMS SECTIONS (IMPORTANT)
    ============================== */
    sections: [sectionSchema],
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model('PageInformation', pageInformationSchema)
