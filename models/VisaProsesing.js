


const mongoose = require("mongoose");

const visaJourneyStepSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
    },

    label: {
      type: String,
      required: true,
    },

    route: {
      type: String,
      required: true,
    },

    page: {
      title: String,
      status: String,
      subtitle: String,
    },

    banner: {
      type: {
        type: String,
      },
      title: String,
      subtitle: String,
      action: String,
      secondaryAction: String,
    },

    progress: {
      type: Number,
      default: 0,
    },

    sections: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    progressSteps: [
      {
        label: String,
        status: String,
      },
    ],

    statusTimeline: [
      {
        title: String,
        date: String,
        status: String,
        isActive: Boolean,
      },
    ],

    importantInfo: [
      {
        type: String,
      },
    ],
  },
  { _id: false }
);

const visaJourneySchema = new mongoose.Schema(
  {
    applicationId: {
      type : String,
      required: true,
    },

    country: {
      type : String,
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    course: {
        type : mongoose.Schema.Types.ObjectId,
        ref: "course",
        require: true
    },

    currentStep: {
      type: Number,
      default: 1,
    },

    // steps: [visaJourneyStepSchema],
    
    steps: {
        type : mongoose.Schema.Types.Mixed,
        default : []
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("VisaProcessing", visaJourneySchema);

