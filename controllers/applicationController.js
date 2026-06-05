const mongoose = require('mongoose');
const Application = require('../models/Application');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const Communication = require('../models/Communication');
const { ScratchCard } = require('../models/Coupon');
const sendNotification = require('../middleware/notificaion');
const User = require('../models/User');


const defaultDocuments = [
  {
    "type": "user",
    "name": "Passport",
    "description": "Front and back copy of passport",
    "status": "Pending",
    "required": "required"
  },
  {
    "type": "user",
    "name": "Academic Documents",
    "description": "10th, 12th, Bachelor's mark sheets (year-wise or semester-wise), consolidated mark sheet, degree or provisional certificate, other certificates",
    "status": "Pending",
    "required": "required"
  },
  {
    "type": "user",
    "name": "Updated CV",
    "description": "Latest curriculum vitae",
    "status": "Pending",
    "required": "required"
  },
  {
    "type": "user",
    "name": "Experience Certificate",
    "description": "Work experience certificate (if available)",
    "status": "Pending",
    "required": "optional"
  },
  {
    "type": "user",
    "name": "Photographs",
    "description": "passport size photographs",
    "status": "Pending",
    "required": "required"
  },
  {
    "type": "user",
    "name": "IELTS Scorecard",
    "description": "IELTS scorecard (if available)",
    "status": "Pending",
    "required": "optional"
  },
  {
    "type": "user",
    "name": "LOR",
    "description": "Letter of Recommendation",
    "status": "Pending",
    "required": "optional"
  }
]



exports.createApplicationWithFiles = async (req, res) => {
  try {
    const {
      country,
      course,
      intake,
      university,
      userId,
    } = req.body;

    const studentId = req.user?._id || userId;

    if (!studentId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const applicationNumber = `OS${Date.now()}`;

    // file URLs from multer
    const passportUrl = req.files?.passport?.[0]
      ? `/uploads/docs/${req.files.passport[0].filename}`
      : "";

    const academicUrl = req.files?.academic?.[0]
      ? `/uploads/docs/${req.files.academic[0].filename}`
      : "";

    const updatedCvUrl = req.files?.cv?.[0]
      ? `/uploads/docs/${req.files.cv[0].filename}`
      : "";

    const experienceCertificateUrl = req.files?.experience?.[0]
      ? `/uploads/docs/${req.files.experience[0].filename}`
      : "";

    const photographUrl = req.files?.photo?.[0]
      ? `/uploads/docs/${req.files.photo[0].filename}`
      : "";

    const documents = [
      {
        type: "user",
        name: "Passport",
        status: passportUrl ? "inreview" : "Pending",
        required: "required",
        docUrl: passportUrl,
      },
      {
        type: "user",
        name: "Academic Documents",
        status: academicUrl ? "inreview" : "Pending",
        required: "required",
        docUrl: academicUrl,
      },
      {
        type: "user",
        name: "Updated CV",
        status: updatedCvUrl ? "inreview" : "Pending",
        required: "required",
        docUrl: updatedCvUrl,
      },
      {
        type: "user",
        name: "Experience Certificate",
        status: experienceCertificateUrl ? "inreview" : "Pending",
        required: "optional",
        docUrl: experienceCertificateUrl,
      },
      {
        type: "user",
        name: "Photographs",
        status: photographUrl ? "inreview" : "Pending",
        required: "required",
        docUrl: photographUrl,
      },
    ];

    const application = await Application.create({
      applicationNumber,
      student: studentId,
      country,
      course,
      intake,
      university,
      documents
    });

    await Communication.create({
      application: application._id,
      type: "activity",
      action: "APPLICATION_CREATED",
      description: `Application ${application.applicationNumber} created.`,
      user: studentId,
    });

    return res.status(201).json({
      success: true,
      data: application,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

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

    let reward;

    const application = await Application.create({
      applicationNumber,
      student: req.user._id,
      country,
      course,
      intake,
      expectations,
      documents: [], // defaultDocuments,
      // extraRequirements,
      backups,
    });


    if (application) {
      await Communication.create({
        application: application._id,
        type: 'activity',
        action: 'APPLICATION_CREATED',
        description: `Application ${application.applicationNumber} was created with intake ${application.intake}.`,
        user: req.user._id
      });
      reward = await ScratchCard.create({
        userId: req.user._id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });
    }



    // 🔥 Get all admins
    const admins = await User.find({ role: "admin" }).select("_id");

    console.log("amdin data on the ", admins, application);

    // 🔔 Send notification to each admin
    if (admins.length > 0) {
      for (const admin of admins) {
        await sendNotification({
          userId: admin._id,
          sender: req.user._id,
          title: "New Application Created",
          body: `Application ${application.applicationNumber} has been created.`,
          type: "admin",
          entityId: application._id,
          entityType: "Application",
          redirectUrl: `/applications/${application._id}`,
          data: {
            applicationId: application._id,
          },
        });
      }
    }



    res.status(201).json({
      success: true,
      data: application,
      isReward: !!reward
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
      studentid,
      isVisashortlist
    } = req.query;

    const matchStage = {};

    if (req.user.role === 'admin') {
      if (student) matchStage.student = new mongoose.Types.ObjectId(student);
    } else {
      matchStage.student = new mongoose.Types.ObjectId(req.user._id);
    }

    if (studentid) matchStage.student = new mongoose.Types.ObjectId(studentid);

    if (course)
      matchStage.course = new mongoose.Types.ObjectId(course);

    if (country) matchStage.country = country;

    if (intake) matchStage.intake = intake;

    if (paymentStatus) matchStage.paymentStatus = paymentStatus;

    if (primaryStatus) matchStage.primaryStatus = primaryStatus;
    
    if (isVisashortlist) matchStage.isVisashortlist = isVisashortlist;

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

    console.log(matchStage);

    const pipeline = [
      { $match: matchStage },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: Number(limit) },

      ...(req.user.role === 'admin'
        ? [{
          $lookup: {
            from: 'users', // Collection to join
            localField: 'student', // Field in main collection
            foreignField: '_id', // Field in 'users' collection
            as: 'student', // Output field name
            pipeline: [
              {
                $lookup: {
                  from: "users", // Nested lookup on 'users' again
                  localField: "assignto", // Field inside student document
                  foreignField: "_id",
                  as: "assignee" // Renamed 'users' to 'assignee' for clarity
                }
              },
              // Unwind the assignee array if there is only 1 assignee
              { $unwind: { path: "$assignee", preserveNullAndEmptyArrays: true } }
            ]
          }
        },
        { $unwind: '$student' } // Unwind the student array
        ]
        : []),

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
    const application = await Application.findOne(mongoose.Types.ObjectId.isValid(req.params.id) ?
      { _id: new mongoose.Types.ObjectId(req.params.id) } : { applicationNumber: req.params.id })
      .populate({
        path: 'course',
        populate: {
          path: 'university',   // this must match your Course schema field name
        }
      }).populate('backups.course', 'name slug').populate('student')


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

    if (application) {
      await Communication.create({
        application: application._id,
        type: 'activity',
        action: 'APPLICATION_updated',
        description: `Application ${application.applicationNumber} was updated with intake ${application.intake}.`,
        user: req.user._id
      });
      reward = await ScratchCard.create({
        userId: req.user._id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
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

exports.uploadAndUpdateDocument = async (req, res) => {
  try {
    const { applicationId, documentId } = req.params;
    const userId = req.user?._id || req.user?.id;

    const fileUrl = `/uploads/docs/${req?.file?.filename || "nofile"}`;

    const additionalUpdates = {};
    if (req.body.answer) additionalUpdates['documents.$.answer'] = req.body.answer;


    const updateFields = {
      'documents.$.status': 'inreview',
      ...additionalUpdates
    };
    if (req.body.docType != 'form') {
      updateFields['documents.$.docUrl'] = fileUrl;
    }

    const updatedApplication = await Application.findOneAndUpdate(
      {
        _id: applicationId,
        // student: userId,
        'documents._id': documentId
      },
      {
        $set: updateFields
      },
      { new: true, runValidators: true }
    );

    if (!updatedApplication) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Application or document not found, or access denied.'
      });
    }

    if (updatedApplication) {
      await Communication.create({
        application: applicationId,
        type: 'activity',
        action: 'APPLICATION_UPDATED',
        description: `Application ${updatedApplication.applicationNumber} updated for document ${documentId}.`,
        user: userId
      });
    }


    const updatedDoc = updatedApplication.documents.id(documentId) ||
      updatedApplication.documents.find(d => d._id.toString() === documentId);

    res.status(200).json({
      success: true,
      message: 'Document uploaded successfully.',
      data: { ...updatedDoc.toObject(), docUrl: fileUrl }
    });
  } catch (error) {
    console.log(error)
    if (req.file) {
      try { fs.unlinkSync(req.file.path); } catch (e) { }
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid ID format.' });
    }
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'File too large. Max 10MB.' });
      }
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({
      success: false,
      message: 'Upload failed.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.updateIntakeAndBackups = async (req, res) => {
  try {
    const { id } = req.params;
    const { intake, backups } = req.body;
    if (Array.isArray(backups)) {
      const seen = new Set();

      for (const item of backups) {
        const key = `${item.course}-${item.intake}`;

        if (seen.has(key)) {
          return res.status(400).json({
            message: `Duplicate backup found for course + intake: ${item.course} / ${item.intake}`,
          });
        }
        seen.add(key);
      }
    }
    const updatedApplication = await Application.findByIdAndUpdate(
      id,
      {
        $set: {
          intake: intake || undefined,
          backups: Array.isArray(backups) ? backups : [],
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );
    if (!updatedApplication) {
      return res.status(404).json({ message: "Application not found" });
    }
    return res.status(200).json({
      message: "Updated successfully",
      data: updatedApplication,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};