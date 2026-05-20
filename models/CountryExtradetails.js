const mongoose = require('mongoose');

const CountryExtradetails = new mongoose.Schema(
  {
    sections: [
      {
        section_key: { type: String, required: true },
        heading: { type: String, default: '', trim: true },
        content: { type: String, default: '', trim: true },
        order: { type: Number, default: 0 }
      }
    ],
    faq: [
      {
        question: { type: String, trim: true },
        answer: { type: String, trim: true }
      }
    ],
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active'
    },
    visa_details: {
      type : mongoose.Schema.Types.Mixed,
      default: {}
    },
    rating : String,
    tuitionfee : String,
    psw : String,
    keyHightlights : {
      type : mongoose.Schema.Types.Mixed,
      default : []
    },
    topcourse : {
      type : mongoose.Schema.Types.Mixed,
      default : []
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('CountryExtradetails', CountryExtradetails);