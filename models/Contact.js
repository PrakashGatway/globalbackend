const mongoose = require('mongoose')

const supportSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      trim: true,
    },
    type:{
      type: String,
      trim: true,
    },
    fullName:{
      type: String,
      trim: true,
      required: true
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
      default: 'Open',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },
    destination: {
      type: String,
      trim: true,
    },
    city:{
      type: String,
      trim: true,
    },
    country:{
      type: String,
      trim: true,
    },
    source:{
      type: String,
      trim: true,
    },
    extraDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    description: {
      type: String,
      required: true,
    },
    resolution: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model('contactform', supportSchema)
