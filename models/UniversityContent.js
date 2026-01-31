const mongoose = require('mongoose')

const universityContentSchema = new mongoose.Schema(
  {
    university: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'University',
      required: true,
      unique: true, // one content doc per university
    },
    

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

    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model('UniversityContent', universityContentSchema)
