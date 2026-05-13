const mongoose = require('mongoose');
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const Application = require('../models/Application');
const Communication = require('../models/Communication');


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



exports.masterControllerWithTransaction = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      // User/Profile fields
      university,
      // course,
      intake,
      name,
      email,
      phone,
      dateOfBirth,
      address1,
      address2,
      city,
      state,
      // country,
      postalcode,
      nationality,
      gender,
      firstLanguage,
      maritalStatus,
      passportNumber,
      passportExpiry,
      destinationCountry,
      destinationcourse,
      backups
    } = req.body;
    const counsellorid = req.user._id;

    // 1. CREATE OR FIND USER
    // Check if user exists by email, or create new
    let user = await User.findOne({ email }).session(session);
    if (user) {
      await session.abortTransaction();
      return res.status(409).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    if (!user) {
      const userResult = await User.create(
        [
          {
            name,
            email,
            phone,
            dateOfBirth,
            nationality,
            gender,
            firstLanguage,
            maritalStatus,
            passportNumber,
            passportExpiry,
            "assignto": counsellorid
          },
        ],
        { session },
      );
      user = userResult[0];
    }

    const userId = user._id;
    console.log(counsellorid, req.user.referalCode)
    // 2. CREATE / UPDATE PROFILE
    const profileData = {
      user: userId,
      address1,
      address2,
      city,
      state,
      postalcode
    };

    // // Calculate completion (ensure this function exists)
    // const completion =
    //   typeof calculateProfileCompletion === "function"
    //     ? calculateProfileCompletion(profileData)
    //     : 100;

    const profile = await UserProfile.findOneAndUpdate(
      { user: userId },
      { $set: { ...profileData } },
      { new: true, upsert: true, runValidators: true, session },
    );

    // 3. CREATE APPLICATION
    const applicationNumber = `OS${Date.now()}`;
    const [application] = await Application.create(
      [
        {
          applicationNumber,
          student: userId,
          university,
          "course": destinationcourse,
          intake,
          "country": destinationCountry,
          backups,
          "rejectionReason": [{ course: destinationcourse, reason: "" }]
        },
      ],
      { session },
    );

    // 4. LOG COMMUNICATION
    await Communication.create(
      [
        {
          application: application._id,
          type: "activity",
          action: "APPLICATION_CREATED",
          description: `Application created for ${university}`,
          user: userId,
        },
      ],
      { session },
    );

    await session.commitTransaction();

    return res.status(201).json({
      success: true,
      message: "Data processed successfully",
      data: {
        userId: userId,
        user,
        profile,
        application,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  } finally {
    session.endSession();
  }
};


exports.updateApplication = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate the application ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid application ID',
      });
    }

    // Find the existing application
    const existingApplication = await Application.findById(id);
    if (!existingApplication) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    // Extract Application fields from request body
    const {
      country,
      course,
      intake,
      paymentStatus,
      expectations,
      documents,
      extraRequirements,
      rejectionReason,
      backups,
      primaryStatus,
      isWithdrawn,
      userNotes,
      adminNotes,
    } = req.body;

    // Build update object with only provided fields
    const updateFields = {};
    if (country !== undefined) updateFields.country = country;
    if (course !== undefined) updateFields.course = course;
    if (intake !== undefined) updateFields.intake = intake;
    if (paymentStatus !== undefined) updateFields.paymentStatus = paymentStatus;
    if (expectations !== undefined) updateFields.expectations = expectations;
    if (extraRequirements !== undefined) updateFields.extraRequirements = extraRequirements;
    if (rejectionReason !== undefined) updateFields.rejectionReason = rejectionReason;
    if (primaryStatus !== undefined) updateFields.primaryStatus = primaryStatus;
    if (isWithdrawn !== undefined) updateFields.isWithdrawn = isWithdrawn;
    if (userNotes !== undefined) updateFields.userNotes = userNotes;
    if (adminNotes !== undefined) updateFields.adminNotes = adminNotes;

    // Validate backups for duplicates if provided
    if (Array.isArray(backups)) {
      const seen = new Set();
      for (const item of backups) {
        const key = `${item.course}-${item.intake}`;
        if (seen.has(key)) {
          return res.status(400).json({
            success: false,
            message: `Duplicate backup found for course + intake: ${item.course} / ${item.intake}`,
          });
        }
        seen.add(key);
      }
      updateFields.backups = backups;
    }

    // Handle document files if uploaded via multipart/form-data
    if (req.files && Object.keys(req.files).length > 0) {
      const existingDocs = existingApplication.documents || [];

      const fileFieldMap = [
        { field: 'passport', name: 'Passport', required: 'required' },
        { field: 'academic', name: 'Academic Documents', required: 'required' },
        { field: 'cv', name: 'Updated CV', required: 'required' },
        { field: 'experience', name: 'Experience Certificate', required: 'optional' },
        { field: 'photo', name: 'Photographs', required: 'required' },
      ];

      const updatedDocs = [...existingDocs];

      for (const mapping of fileFieldMap) {
        const uploadedFile = req.files[mapping.field]?.[0];
        if (uploadedFile) {
          const fileUrl = `/uploads/docs/${uploadedFile.filename}`;
          const existingIndex = updatedDocs.findIndex(d => d.name === mapping.name);

          if (existingIndex !== -1) {
            updatedDocs[existingIndex] = {
              ...updatedDocs[existingIndex].toObject?.() || updatedDocs[existingIndex],
              docUrl: fileUrl,
              status: 'inreview',
            };
          } else {
            updatedDocs.push({
              type: 'user',
              name: mapping.name,
              status: 'inreview',
              required: mapping.required,
              docUrl: fileUrl,
            });
          }
        }
      }

      updateFields.documents = updatedDocs;
    } else if (documents !== undefined) {
      updateFields.documents = documents;
    }

    const updatedApplication = await Application.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true }
    )
      .populate({
        path: 'course',
        populate: { path: 'university' },
      })
      .populate('backups.course', 'name slug');

    // Log communication
    await Communication.create({
      application: updatedApplication._id,
      type: 'activity',
      action: 'APPLICATION_UPDATED',
      description: `Application ${updatedApplication.applicationNumber} updated. Fields: ${Object.keys(updateFields).join(', ')}`,
      user: req.user._id,
    });

    return res.status(200).json({
      success: true,
      message: 'Application updated successfully',
      data: updatedApplication,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


exports.getDataByAssignTo = async (req, res) => {
  try {
    const counsellorId = req.user._id;

    const data = await User.find({ assignto: counsellorId })
      .populate("assignto", "name email")
      .lean();

    for (let user of data) {
      user.profile = await UserProfile.findOne({ user: user._id });
      user.applications = await Application.find({ student: user._id });
      user.communications = await Communication.find({ user: user._id });
    }

    return res.status(200).json({
      success: true,
      data
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// exports.getApplicationsByCounsellor = async (req, res) => {
//   try {
//     const counsellorId = req.user._id;
//     const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
//     const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);
//     const skip = (page - 1) * limit;

//     const aggregated = await Application.aggregate([
//       {
//         $lookup: {
//           from: "users", 
//           localField: "student",
//           foreignField: "_id",
//           as: "student"
//         }
//       },
//       {
//         $unwind: {
//           path: "$student",
//           preserveNullAndEmptyArrays: false
//         }
//       },
//       {
//         $match: {
//           "student.assignto": counsellorId
//         }
//       },
//       {
//         $lookup: {
//           from: "userprofiles",
//           localField: "student._id",
//           foreignField: "user",
//           as: "profile"
//         }
//       },
//       {
//         $unwind: {
//           path: "$profile",
//           preserveNullAndEmptyArrays: true
//         }
//       },

//       // 5. (Optional) Join Communications
//       // {
//       //   $lookup: {
//       //     from: "communications",
//       //     localField: "_id",
//       //     foreignField: "application",
//       //     as: "communications"
//       //   }
//       // },

//       // 6. Clean response (VERY IMPORTANT)
//       {
//         $project: {
//           _id: 1,
//           applicationNumber: 1,
//           university: 1,
//           course: 1,
//           intake: 1,
//           country: 1,
//           status: 1,
//           backups: 1,
//           createdAt: 1,
//           primaryStatus: 1,
//           paymentStatus: 1,

//           // student fields
//           "student._id": 1,
//           "student.name": 1,
//           "student.email": 1,
//           "student.phone": 1,

//           // profile
//           profile: 1,

//           // communications
//           // communications: 1
//         }
//       },

//       // 7. Sort latest first
//       {
//         $sort: { createdAt: -1 }
//       },
//       {
//         $facet: {
//           metadata: [{ $count: "total" }],
//           data: [{ $skip: skip }, { $limit: limit }]
//         }
//       }
//     ]);

//     const metadata = aggregated[0]?.metadata[0] || { total: 0 };
//     const applications = aggregated[0]?.data || [];

//     return res.status(200).json({
//       success: true,
//       count: applications.length,
//       total: metadata.total,
//       page,
//       limit,
//       data: applications
//     });

//   } catch (error) {
//     console.error("Aggregation Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

exports.getApplicationsByCounsellor = async (req, res) => {
  try {
    const counsellorId = req.user._id;

    const {
      course,
      country,
      intake,
      paymentStatus,
      primaryStatus,
      startDate,
      endDate,
      search
    } = req.query;

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);
    const skip = (page - 1) * limit;

    // ✅ Build dynamic match stage
    let matchStage = {};

    if (course) matchStage.course = new mongoose.Types.ObjectId(course);

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

    // // Search
    // if (search) {
    //   matchStage.applicationNumber = {
    //     $regex: search,
    //     $options: "i",
    //   };
    // }

    // 🔍 Enhanced Search Logic (place this BEFORE building matchStage)
    if (search && search.trim()) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape regex special chars

      matchStage.$or = [
        { applicationNumber: { $regex: escapedSearch, $options: "i" } },
        // Student fields (after $lookup + $unwind, these are at root.student.*)
        { "student.name": { $regex: escapedSearch, $options: "i" } },
        { "student.email": { $regex: escapedSearch, $options: "i" } },
        { "student.phone": { $regex: escapedSearch, $options: "i" } },
        { university: { $regex: escapedSearch, $options: "i" } },
        { country: { $regex: escapedSearch, $options: "i" } },
        { intake: { $regex: escapedSearch, $options: "i" } },

      ];
    }

    const aggregated = await Application.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "student",
          foreignField: "_id",
          as: "student"
        }
      },
      {
        $unwind: {
          path: "$student",
          preserveNullAndEmptyArrays: false
        }
      },
      // ✅ Counsellor filter
      {
        $match: {
          "student.assignto": counsellorId
        }
      },
      // ✅ Apply dynamic filters here
      {
        $match: matchStage
      },
      {
        $lookup: {
          from: "userprofiles",
          localField: "student._id",
          foreignField: "user",
          as: "profile"
        }
      },
      {
        $unwind: {
          path: "$profile",
          preserveNullAndEmptyArrays: true
        }
      },

      {
        $project: {
          _id: 1,
          applicationNumber: 1,
          university: 1,
          course: 1,
          intake: 1,
          country: 1,
          status: 1,
          backups: 1,
          createdAt: 1,
          updatedAt: 1,
          primaryStatus: 1,
          paymentStatus: 1,

          student: {
            _id: "$student._id",
            name: "$student.name",
            email: "$student.email",
            phone: "$student.phone"
          },

          profile: 1
        }
      },

      {
        $sort: { createdAt: -1 }
      },
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [{ $skip: skip }, { $limit: limit }]
        }
      }
    ]);

    const metadata = aggregated[0]?.metadata[0] || { total: 0 };
    const applications = aggregated[0]?.data || [];

    return res.status(200).json({
      success: true,
      count: applications.length,
      total: metadata.total,
      page,
      limit,
      data: applications
    });

  } catch (error) {
    console.error("Aggregation Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


exports.createApplication = async (req, res) => {
  try {
    const {
      student,
      university,
      destinationcourse: course, // Renamed for model consistency
      intake,
      destinationCountry: country,
      backups
    } = req.body;

    // 1. Better Validation (400 instead of 401)
    if (!student || !university || !course) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: student, university, or course.'
      });
    }

    // 2. Safer ID generation (OS + Timestamp + 4 random chars)
    const applicationNumber = `OS${Date.now()}`;

    const application = await Application.create({
      documents: defaultDocuments,
      applicationNumber,
      student,
      university,
      course,
      intake,
      country,
      backups,
      rejectionReason: [{ course, reason: "" }]
    });

    // 3. Activity Logging
    if (application) {
      await Communication.create({
        application: application._id,
        type: 'activity',
        action: 'APPLICATION_CREATED',
        description: `Application ${application.applicationNumber} created for intake ${intake}.`,
        user: student
      });
    }

    res.status(201).json({
      success: true,
      data: application,
    });

  } catch (error) {
    console.error("Application Creation Error:", error); // Log for debugging
    res.status(500).json({
      success: false,
      message: 'Internal Server Error', // Hide raw DB errors from users
    });
  }
};
