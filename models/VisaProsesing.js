const mongoose = require("mongoose");

const visaProcessingSchema = new mongoose.Schema(
{
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    
    application: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Application",
        required: true,
        unique: true
    },

    visaDetails: {
        category: {
            type: String,
            default : "Student Visa"
        },

        country: {
            type: String,
            required: true
        },

        embassy: String,
        purpose: String,
        intake: String
    },

    steps: [
        {
            title: String,
            status: {
                type: String,
                enum: ["Pending", "Completed"],
                default: "Pending"
            },
            completedAt: Date,
            stepDetails: {
                type: mongoose.Schema.Types.Mixed,
                default: []
            },
        }
    ],


    documents: [
        {
            name: String,
            status: {
                type: String,
                enum: ["Pending", "Approved", "Rejected"],
                default: "Pending"
            },
            data: {
                type: mongoose.Schema.Types.Mixed,
                default: {}
            }
        }
    ],

    biometrics: {
        status: {
            type: String,
            enum: ["Pending", "Approved", "Rejected"],
            default: "Pending"
        },

        completedDate: Date,
        validityPeriod: String,

        otherinfo: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        }
    },

    financialInfo: {
        method: String,
        accountNumber: String,
        totalamount: Number,
        currency: String,

        paymentStatus: {
            type: String,
            enum: ["Pending", "Approved", "Rejected"],
            default: "Pending"
        },

        otherinfo: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        }
    }

},
{ timestamps: true }
);

visaProcessingSchema.index({ applicationNumber: 1 });

module.exports = mongoose.model("VisaProcessing", visaProcessingSchema);
