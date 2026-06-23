const Scholarship = require('../models/Scholarship');


exports.createScholarship = async (req, res) => {
    try {
        const scholarship = await Scholarship.create(req.body);

        res.status(201).json({
            success: true
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

exports.getScholarships = async (req, res) => {
    try {
        const {
            country,
            university,
            subject,
            level,
            status,
            isPublished,
            fundingType,
            page = 1,
            limit = 20,
        } = req.query;

        const pageNumber = Math.max(parseInt(page), 1);
        const pageSize = Math.max(parseInt(limit), 1);
        const skip = (pageNumber - 1) * pageSize;

        const match = {};

        if (country) match.country = new mongoose.Types.ObjectId(country);
        if (university) match.university = new mongoose.Types.ObjectId(university);
        if (subject) match.subject = new mongoose.Types.ObjectId(subject);
        if (fundingType) match.fundingType = fundingType;
        if (status) match.status = status;
        if (isPublished && isPublished !== null && isPublished !== undefined) match.isPublished = isPublished === 'true';
        if (level) match.level = { $in: level.split(',') };

        const result = await Scholarship.aggregate([
            { $match: match },

            {
                $lookup: {
                    from: 'countries',
                    localField: 'country',
                    foreignField: '_id',
                    as: 'country',
                },
            },
            {
                $unwind: {
                    path: "$country",
                    preserveNullAndEmptyArrays: true
                }
            },

            {
                $lookup: {
                    from: 'universities',
                    localField: 'university',
                    foreignField: '_id',
                    as: 'university',
                },
            },
            {
                $unwind: {
                    path: "$university",
                    preserveNullAndEmptyArrays: true
                }
            },

            //   {
            //     $lookup: {
            //       from: 'subjects',
            //       localField: 'subject',
            //       foreignField: '_id',
            //       as: 'subject',
            //     },
            //   },
            //   { $unwind: '$subject' },

            { $sort: { createdAt: -1 } },

            {
                $project: {
                    title: 1,
                    slug: 1,
                    level: 1,
                    fundingType: 1,
                    amount: 1,
                    status: 1,
                    isPublished: 1,
                    createdAt: 1,
                    description: 1,
                    shortDescription: 1,
                    level: 1,
                    studyMode: 1,
                    deliveryMode: 1,
                    valueDetails: 1,
                    eligibilityCriteria: 1,
                    benefits: 1,
                    exclusionCriteria: 1,
                    selectionBasis: 1,
                    deadline: 1,
                    isPublished: 1,
                    intake: 1,
                    subjects: 1,
                    howToApply: 1,
                    metaData: 1,
                    country: { name: 1, code: 1, _id: 1 },
                    university: { name: 1, slug: 1, _id: 1 },
                },
            },

            {
                $facet: {
                    data: [
                        { $skip: skip },
                        { $limit: pageSize },
                    ],
                    totalCount: [
                        { $count: 'count' },
                    ],
                },
            },
        ]);

        const scholarships = result[0].data;
        const total = result[0].totalCount[0]?.count || 0;
        const totalPages = Math.ceil(total / pageSize);

        res.status(200).json({
            success: true,
            pagination: {
                total,
                page: pageNumber,
                limit: pageSize,
                totalPages,
            },
            data: scholarships,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};



exports.getScholarshipById = async (req, res) => {
    try {
        const scholarships = await Scholarship.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(req.params.id),
                },
            },

            {
                $lookup: {
                    from: 'countries',
                    localField: 'country',
                    foreignField: '_id',
                    as: 'country',
                },
            },
            { $unwind: '$country' },

            {
                $lookup: {
                    from: 'universities',
                    localField: 'university',
                    foreignField: '_id',
                    as: 'university',
                },
            },
            { $unwind: '$university' },

            {
                $lookup: {
                    from: 'subjects',
                    localField: 'subject',
                    foreignField: '_id',
                    as: 'subject',
                },
            },
            { $unwind: '$subject' },
        ]);

        if (!scholarships.length) {
            return res.status(404).json({
                success: false,
                message: 'Scholarship not found',
            });
        }

        res.status(200).json({
            success: true,
            data: scholarships[0],
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

exports.getScholarshipBySlug = async (req, res) => {
    try {
        const scholarships = await Scholarship.aggregate([
            {
                $match: {
                    slug: req.params.slug,
                    status: 'Active',
                    isPublished: true,
                },
            },

            {
                $lookup: {
                    from: 'countries',
                    localField: 'country',
                    foreignField: '_id',
                    as: 'country',
                },
            },
            { $unwind: '$country' },

            {
                $lookup: {
                    from: 'universities',
                    localField: 'university',
                    foreignField: '_id',
                    as: 'university',
                },
            },
            { $unwind: '$university' },

            {
                $lookup: {
                    from: 'subjects',
                    localField: 'subject',
                    foreignField: '_id',
                    as: 'subject',
                },
            }
        ]);

        if (!scholarships.length) {
            return res.status(404).json({
                success: false,
                message: 'Scholarship not found',
            });
        }

        res.status(200).json({
            success: true,
            data: scholarships[0],
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

exports.updateScholarship = async (req, res) => {
    try {
        const scholarship = await Scholarship.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        if (!scholarship) {
            return res.status(404).json({
                success: false,
                message: 'Scholarship not found',
            });
        }

        res.status(200).json({
            success: true,
            data: scholarship,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

exports.deleteScholarship = async (req, res) => {
    try {
        const scholarship = await Scholarship.findByIdAndDelete(req.params.id);

        if (!scholarship) {
            return res.status(404).json({
                success: false,
                message: 'Scholarship not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Scholarship deleted successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const mongoose = require('mongoose');

exports.getPublicScholarships = async (req, res) => {
    try {
        const {
            country,
            university,
            subject,
            level,
            fundingType,
            page = 1,
            limit = 10,
            search,
            deliveryMode
        } = req.query;

        const pageNumber = Math.max(parseInt(page), 1);
        const pageSize = Math.max(parseInt(limit), 1);
        const skip = (pageNumber - 1) * pageSize;

        const match = {
            // status: 'Active',
            // isPublished: true,
        };

        if (country && country != undefined && mongoose.isValidObjectId(country)) match.country = new mongoose.Types.ObjectId(country);
        if (university) match.university = new mongoose.Types.ObjectId(university);
        if (subject) match.subject = new mongoose.Types.ObjectId(subject);
        if (fundingType) match.fundingType = fundingType;
        if (level) match.level = { $in: level.split(',') };
        if(deliveryMode) match.deliveryMode = deliveryMode

     if(search) match.$or =  [
        { title: { $regex: search, $options: "i" } }, 
        { "university.name": { $regex: search, $options: "i" } },
        { "subject.name": { $regex: search, $options: "i" } }
      ]
    

        console.log(match)

        const result = await Scholarship.aggregate([
            { $match: match },

            // {
            //     $lookup: {
            //         from: 'countries',
            //         localField: 'country',
            //         foreignField: '_id',
            //         as: 'country',
            //     },
            // },
            // { $unwind: '$country' },

            // {
            //     $lookup: {
            //         from: 'universities',
            //         localField: 'university',
            //         foreignField: '_id',
            //         as: 'university'
            //     },
            // },
            // { $unwind: '$university' },
            { $sort: { createdAt: -1 } },
            {
                $facet: {
                    data: [
                        { $skip: skip },
                        { $limit: pageSize },
                    ],
                    totalCount: [
                        { $count: 'count' },
                    ],
                },
            },
        ]);

        const scholarships = result[0].data;
        const total = result[0].totalCount[0]?.count || 0;
        const totalPages = Math.ceil(total / pageSize);

        res.status(200).json({
            success: true,
            pagination: {
                total,
                page: pageNumber,
                limit: pageSize,
                totalPages,
            },
            data: scholarships,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

