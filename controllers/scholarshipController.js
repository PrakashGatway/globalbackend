const CountryExtradetails = require('../models/CountryExtradetails');
const Scholarship = require('../models/Scholarship');
const mongoose = require('mongoose');


exports.createScholarship = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const {sections, ...alldata} = req.body;

        // const scholarship = await Scholarship.create(req.body);

        
            // Create extra details (handle empty case)
            let extraDetails = null;
            if (sections && Object.keys(sections).length > 0) {
              extraDetails = await CountryExtradetails.create(
                [sections || {}],
                { session }
              );
            }
        
            // Create country with reference to extra details
            const country = await Scholarship.create(
              [{
                ...alldata,
                extra_content: extraDetails ? extraDetails[0]._id : null
              }],
              { session }
            );
        
            await session.commitTransaction();
            session.endSession();

        res.status(201).json({
            success: true
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();

        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

exports.updateScholarship = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        await session.startTransaction();

        const { sections, ...alldata } = req.body;

        const [id, extraDetailsId] = req.params.id.split(",");

        let updatedExtraDetails = null;

        if (sections && sections.length > 0) {
            const extraDetailsData = {
                sections,
            };

            if (extraDetailsId && extraDetailsId !== "null") {
                
                updatedExtraDetails = await CountryExtradetails.findByIdAndUpdate(
                    extraDetailsId,
                    extraDetailsData,
                    {
                        new: true,
                        runValidators: true,
                        session,
                    }
                );
            } else {
                
                const createdExtraDetails = await CountryExtradetails.create(
                    [extraDetailsData],
                    { session }
                );

                updatedExtraDetails = createdExtraDetails[0];
            }
        }

        // Update scholarship
        const scholarship = await Scholarship.findByIdAndUpdate(
            id,
            {
                ...alldata,
                extra_content: updatedExtraDetails? updatedExtraDetails._id : null,
            },
            {
                session,
            }
        );

        if (!scholarship) {
            await session.abortTransaction();
            session.endSession();

            return res.status(404).json({
                success: false,
                message: "Scholarship not found",
            });
        }

        await session.commitTransaction();
        session.endSession();

        return res.status(200).json({
            success: true,
            data: scholarship,
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();

        return res.status(400).json({
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

            {
                $lookup: {
                    from: 'countryextradetails',
                    localField: 'extra_content',
                    foreignField: '_id',
                    as: 'extra_content',
                },
            },
              
            {
                $unwind: {
                    path: "$extra_content",
                    preserveNullAndEmptyArrays: true
                }
            },
            //   { $unwind: '$extra_content' },

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
                    extra_content:1,
                    howToApply: 1,
                    metaData: 1,
                    country: { name: 1, code: 1, _id: 1 },
                    university: { name: 1, slug: 1, _id: 1 },
                    seoiTitle: 1,
                    seoDescription: 1,
                    seoKeyword: 1
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
            
            {
                $lookup: {
                    from: 'countryextradetails',
                    localField: 'extra_content',
                    foreignField: '_id',
                    as: 'extra_content',
                },
            },
              
            {
                $unwind: {
                    path: "$extra_content",
                    preserveNullAndEmptyArrays: true
                }
            },
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
        console.log(req.params.slug,"slug")

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
            },

            {
                $lookup: {
                    from: 'countryextradetails',
                    localField: 'extra_content',
                    foreignField: '_id',
                    as: 'extra_content',
                },
            },
            {
                $unwind: {
                    path: "$extra_content",
                    preserveNullAndEmptyArrays: true
                }
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

