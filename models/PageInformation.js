const mongoose = require('mongoose')

const pageInformationSchema = new mongoose.Schema(
  {
    pageType: {
      type: String,
      required: [true, 'Please provide page type'],
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
        'other'
      ],
      default: 'home_page',
    },
    title: {
      type: String,
      required: false,
      trim: true,
    },
    subTitle: {
      type: String,
      trim: true,
    },
    navbarTitle: {
      type: String,
      trim: true,
    },
    route: {
      type: String,
      trim: true,
    },
    hasDropdown: {
      type: Boolean,
      default: false,
    },
    slug: {
      type: String,
      required: [true, 'Please provide slug'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    metaTitle: {
      type: String,
      trim: true,
    },
    metaDescription: {
      type: String,
      trim: true,
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
    // Home page specific fields
    heroImage: {
      type: String,
      default: null,
    },
    heroImagePublicId: {
      type: String,
      default: null,
    },
    roadmapImage: {
      type: String,
      default: null,
    },
    roadmapImagePublicId: {
      type: String,
      default: null,
    },
    mobileRoadmapImage: {
      type: String,
      default: null,
    },
    mobileRoadmapImagePublicId: {
      type: String,
      default: null,
    },
    // Additional background images for different sections
    universityCapBg: {
      type: String,
      default: null,
    },
    universityCapBgPublicId: {
      type: String,
      default: null,
    },
    universitySliderBg: {
      type: String,
      default: null,
    },
    universitySliderBgPublicId: {
      type: String,
      default: null,
    },

  
    immigrationServices1Bg: {
      type: String,
      default: null,
    },
    immigrationServices1BgPublicId: {
      type: String,
      default: null,
    },
    immigrationServices2Bg: {
      type: String,
      default: null,
    },
    immigrationServices2BgPublicId: {
      type: String,
      default: null,
    },
    sections: [
      {
        type: {
          type: String,
          required: true,
          trim: true,
          lowercase: true,
          // Enum removed -  section type allowed 
          // Frontend/Controller validation if need
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
    ],
    // SEO fields
    keywords: {
      type: [String],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
    },
    canonicalUrl: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model('PageInformation', pageInformationSchema)
