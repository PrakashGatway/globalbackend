const mongoose = require("mongoose");
const Visa = require("../models/VisaProsesing");
const Communication = require("../models/Communication");


exports.startVisaProcessing = async (req, res) => {

    const session = await mongoose.startSession();

    try {

        session.startTransaction();

        const { userId, application } = req.body;

        if (!userId || !application) {

            await session.abortTransaction();

            return res.status(400).json({
                success: false,
                message: "userId and applicationNumber are required",
            });
        }

        // Check existing visa processing
        const existing = await Visa.findOne({
            application
        })
            .session(session)
            .lean();

        if (existing) {

            await session.abortTransaction();

            return res.status(400).json({
                success: false,
                message: "Visa processing already started",
            });
        }


        const [data] = await Visa.create(
            [req.body],
            { session }
        );


        await Communication.create(
            [{
                application: application,
                type: "activity",
                action: "VISA_PROCESSING_START",
                description: `Visa processing started for application ${application}.`,
                user: userId,
            }],
            { session }
        );

        await session.commitTransaction();

        return res.status(201).json({
            success: true,
            data,
        });

    } catch (error) {

        if (session.inTransaction()) {
            await session.abortTransaction();
        }

        return res.status(500).json({
            success: false,
            message: error.message,
        });

    } finally {

        await session.endSession();

    }
};


exports.getAllVisaProcessing = async (req, res) => {
    try {

        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;

        const skip = (page - 1) * limit;

        const filter = {};

        // Optional filters
        if (req.query.status) {
            filter["biometrics.status"] = req.query.status;
        }

        if (req.query.country) {
            filter["visaDetails.country"] = req.query.country;
        }

        const total = await Visa.countDocuments(filter);

        const data = await Visa.find(filter)
            .populate("userId", "name email")
            .populate("applicationNumber")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        return res.status(200).json({
            success: true,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            data,
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message,
        });

    }
};


exports.getSingleVisaProcessing = async (req, res) => {
    try {

        const data = await Visa.findOne({ application: req.params.id })
            .populate("userId", "name email")
        // .populate("application");

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Visa processing not found",
            });
        }

        return res.status(200).json({
            success: true,
            data,
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message,
        });

    }
};


exports.getVisaProcessing = async (req, res) => {
    try {

        // const userId = req.user?._id;

        const data = await Visa.findOne({ userId: req.user?._id })
        .populate("userId", "name email")
        .populate("Application");
        console.log("visa ", req.user.id);
        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Visa processing not found",
            });
        }

        return res.status(200).json({
            success: true,
            data,
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message,
        });

    }
};


exports.updateVisaProcessing = async (req, res) => {
    try {

        const data = await Visa.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true,
            }
        );

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Visa processing not found",
            });
        }

        await Communication.create({
            application: data.application,
            type: "activity",
            action: "VISA_PROCESSING_UPDATED",
            description: `Visa processing updated.`,
            user: data.userId,
        });

        return res.status(200).json({
            success: true,
            data,
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message,
        });

    }
};


exports.deleteVisaProcessing = async (req, res) => {
    try {

        const data = await Visa.findByIdAndDelete(req.params.id);

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Visa processing not found",
            });
        }

        await Communication.create({
            application: data.applicationNumber,
            type: "activity",
            action: "VISA_PROCESSING_DELETED",
            description: `Visa processing deleted.`,
            user: data.userId,
        });

        return res.status(200).json({
            success: true,
            message: "Visa processing deleted successfully",
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message,
        });

    }
};


exports.updateDocumentStatus = async (req, res) => {
    try {

        const { visaId, documentId, status } = req.body;

        const visa = await Visa.findById(visaId);

        if (!visa) {
            return res.status(404).json({
                success: false,
                message: "Visa processing not found",
            });
        }

        const document = visa.documents.id(documentId);

        if (!document) {
            return res.status(404).json({
                success: false,
                message: "Document not found",
            });
        }

        document.status = status;

        await visa.save();

        return res.status(200).json({
            success: true,
            data: visa,
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message,
        });

    }
};

