const mongoose = require('mongoose')

const extraContent = new mongoose.Schema(
  {
    sections: [
      {
        section_key: {
          type: String, // overview, academics, campus_life, etc.
          required: true,
        },
        heading: {
          type: String,
          default: '',
        },
        content: {
          type: String, // HTML from editor
          default: '',
        },
        order: {
          type: Number,
          default: 0,
        },
      },
    ],
    extra: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    }
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model('extraContent', extraContent)
