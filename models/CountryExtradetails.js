const mongoose = require('mongoose')

const CountryExtradetails = new mongoose.Schema(
  {
    sections: [
      {
        section_key: {
          type: String, 
          required: true,
        },
        heading: {
          type: String,
          default: '',
        },
        content: {
          type: String, 
          default: '',
        },
        order: {
          type: Number,
          default: 0,
        },
      },
    ],
    faq : [
        {
         question : String,
         answer : String
        }
    ],
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

module.exports = mongoose.model('CountryExtradetails', CountryExtradetails)
