const mongoose = require('mongoose')

const faqSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },

    answer: {
      type: String, // HTML allowed (CKEditor)
      required: true,
      trim: true,
    },

    type: {
      type: String,
      required: true,
      enum: [
        'General',
        'About',
        'Contact',
        'Course',
        'University',
        'Scholarship',
        'Visa',
        'Admission',
        'Application',
        'Other',
      ],
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
      index: true,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Faq', faqSchema);