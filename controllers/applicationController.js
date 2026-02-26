const mongoose = require('mongoose');
const Application = require('../models/Application');

exports.createApplication = async (req, res) => {
  try {
    const {
      country,
      course,
      intake,
      expectations,
      documents,
      extraRequirements,
      backups,
    } = req.body;

    const applicationNumber = `OS${Date.now()}`; // OS prefix uppercase
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      })
    }

    const application = await Application.create({
      applicationNumber,
      student: req.user._id,
      country,
      course,
      intake,
      expectations,
      documents,
      extraRequirements,
      backups,
    });

    res.status(201).json({
      success: true,
      data: application,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getApplications = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      student,
      country,
      course,
      intake,
      paymentStatus,
      primaryStatus,
      search,
      startDate,
      endDate,
    } = req.query;

    const matchStage = {};

    matchStage.student = new mongoose.Types.ObjectId(req.user._id);

    if (course)
      matchStage.course = new mongoose.Types.ObjectId(course);

    if (country) matchStage.country = country;

    if (intake) matchStage.intake = intake;

    if (paymentStatus) matchStage.paymentStatus = paymentStatus;

    if (primaryStatus) matchStage.primaryStatus = primaryStatus;

    // Date filter
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    // Search
    if (search) {
      matchStage.applicationNumber = {
        $regex: search,
        $options: 'i',
      };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const total = await Application.countDocuments(matchStage);

    const pipeline = [
      { $match: matchStage },

      // Sort before pagination
      { $sort: { createdAt: -1 } },

      // Pagination BEFORE lookup (performance optimized)
      { $skip: skip },
      { $limit: Number(limit) },

      // ...(req.user.role === 'admin'
      //   ? [
      //     {
      //       $lookup: {
      //         from: 'users',
      //         localField: 'student',
      //         foreignField: '_id',
      //         as: 'student',
      //       },
      //     },
      //     { $unwind: '$student' },
      //   ]
      //   : []),

      {
        $lookup: {
          from: 'courses',
          localField: 'course',
          foreignField: '_id',
          as: 'course',
          pipeline: [
            {
              $lookup: {
                from: 'universities',
                localField: 'university',
                foreignField: '_id',
                as: 'university'
              },
            },
            { $unwind: '$university' }
          ]
        },
      },
      { $unwind: '$course' },
    ];

    const data = await Application.aggregate(pipeline);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / limit),
      results: data.length,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getApplication = async (req, res) => {
  try {
    const application = await Application.findOne(mongoose.Types.ObjectId.isValid(req.params.id) ? { _id: new mongoose.Types.ObjectId(req.params.id) } : { applicationNumber: req.params.id })
      .populate({
        path: 'course',
        populate: {
          path: 'university',   // this must match your Course schema field name
        }
      }).populate('backups.course', 'name slug');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateApplication = async (req, res) => {
  try {
    const application = await Application.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteApplication = async (req, res) => {
  try {
    const application = await Application.findOneAndUpdate({
      _id: req.params.id,
      paymentStatus: 'Pending', // Only allow deletion if payment is still pending
      isWithdrawn: false,
    }, {
      isWithdrawn: true
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found or already withdrawn',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Application withdrawn successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};