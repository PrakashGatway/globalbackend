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
                default: "Student Visa"
            },

            country: {
                type: String,
                required: true
            },

            embassy: String,
            purpose: String,
            intake: String
        },

        // steps: [
        //     {
        //         title: String,
        //         status: {
        //             type: String,
        //             enum: ["Pending", "In process", "Completed", "Upcoming"],
        //             default: "Pending"
        //         },
        //         completedAt: Date,
        //         stepDetails: {
        //             type: mongoose.Schema.Types.Mixed,
        //             default: []
        //         },
        //     }
        // ],

        
    steps: {
        type: [
            {
                title: {
                    type: String,
                    required: true
                },
                status: {
                    type: String,
                    enum: ["Pending", "In process", "Completed", "Upcoming", "Locked"], // Added "Locked" from your image
                    default: "Locked" // Sets the initial UI state shown in your image
                },
                completedAt: {
                    type: Date,
                    default: null
                },
                stepDetails: {
                    type: mongoose.Schema.Types.Mixed,
                    default: {} // Changed to an object to avoid BSON/Array casting issues later
                },
            }
        ],
        // This function automatically runs and inserts these 4 steps on creation
        default: () => [
            { title: "Visa Application", status: "Locked" },
            { title: "Biometrics", status: "Locked" },
            { title: "Visa Decision", status: "Locked" },
            { title: "Visa Approval", status: "Locked" }
        ]
    },

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
