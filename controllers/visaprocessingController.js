const mongoose = require("mongoose");
const Visa = require("../models/VisaProsesing");

const Countries = require("../models/Country");
const User = require("../models/User");

// exports.createVisaProcessing = async (req, res) => {
//   const session = await mongoose.startSession();

//   try {
//     session.startTransaction();

//     const { userId, applicationId, country, course } = req.body;

//     if (!userId || !applicationId || !country || !course) {
//       await session.abortTransaction();
//       return res.status(400).json({
//         success: false,
//         message: "userId, applicationId, country, and course are required",
//       });
//     }

//     const existing = await Visa.findOne({ applicationId }).session(session);

//     if (existing) {
//       await session.abortTransaction();
//       return res.status(400).json({
//         success: false,
//         message: "Visa processing already exists for this application",
//       });
//     }

//     const [data] = await Visa.create([req.body], { session });

//     await session.commitTransaction();

//     return res.status(201).json({
//       success: true,
//       data,
//     });
//   } catch (error) {
//     if (session.inTransaction()) await session.abortTransaction();
//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   } finally {
//     await session.endSession();
//   }
// };


exports.createVisaProcessing = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { userId, applicationId, country, course } = req.body;

    
    if (!userId || !applicationId || !country || !course) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "userId, applicationId, country, and course are required",
      });
    }

    
    const existing = await Visa.findOne({ applicationId }).session(session);
    if (existing) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Visa processing already exists for this application",
      });
    }

    
    const countryData = await Countries.findOne({
      $or: [{ _id: mongoose.isValidObjectId(country) ? country : null }, { code: country }]
    }).session(session);

    if (!countryData) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "The specified country could not be found",
      });
    }


    const formattedSteps = countryData.visaSteps.steps || []

    
    const visaPayload = {
      ...req.body,
      steps: formattedSteps       
    };

    const [data] = await Visa.create([visaPayload], { session });

    await session.commitTransaction();

    return res.status(201).json({
      success: true,
      data,
    });
    
  } catch (error) {
    if (session.inTransaction()) await session.abortTransaction();
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

    const matchStage = {};

    // Apply active query filters
    if (req.query.country) matchStage.country = req.query.country;
    if (req.query.currentStep) matchStage.currentStep = Number(req.query.currentStep);
    if (req.query.applicationId) matchStage.applicationId = req.query.applicationId; 

    const pipeline = [
      { $match: matchStage },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },

      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "courses",
          localField: "course",
          foreignField: "_id",
          as: "course",
        },
      },
      { $unwind: { path: "$course", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "applications",
          localField: "applicationId",
          foreignField: "applicationNumber",
          as: "application",
        },
      },
      { $unwind: { path: "$application", preserveNullAndEmptyArrays: true } },

      {
        $project: {
          applicationId: 1,
          country: 1,
          currentStep: 1,
          steps: 1,
          createdAt: 1,
          updatedAt: 1,
          user: { name: 1, email: 1, _id: 1 },
          course: { name: 1, _id: 1 }, 
          application: 1, 
        },
      },
    ];

    const totalPipeline = [
      { $match: matchStage }, 
      { $count: "total" }
    ];

    // Optimize execution time by running both aggregation queries in parallel
    const [data, totalResult] = await Promise.all([
      Visa.aggregate(pipeline),
      Visa.aggregate(totalPipeline),
    ]);

    const total = totalResult.length > 0 ? totalResult[0].total : 0;

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
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Visa Processing ID format",
      });
    }

    const pipeline = [
      { $match: { _id: new mongoose.Types.ObjectId(id) } },

      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "courses",
          localField: "course",
          foreignField: "_id",
          as: "course",
        },
      },
      { $unwind: { path: "$course", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "applications",
          localField: "applicationId",
          foreignField: "applicationNumber",
          as: "application",
        },
      },
      { $unwind: { path: "$application", preserveNullAndEmptyArrays: true } },

      {
        $project: {
          applicationId: 1,
          country: 1,
          currentStep: 1,
          steps: 1,
          createdAt: 1,
          updatedAt: 1,
          user: { name: 1, email: 1, _id: 1 },
          course: { name: 1, _id: 1 }, 
          application: 1,
          documents : 1
        },
      },
    ];

    const result = await Visa.aggregate(pipeline);

    if (!result || result.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Visa processing not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: result[0],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getcounsellorVisaProcessing = async (req, res) => {
  try {
    
    const users = await User.find({ "assignto": req.user._id });
    const userIds = users.map(user => user._id);

    const pipeline = [
      
      { 
        $match: { 
          userId: { $in: userIds } 
        } 
      },

      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "courses",
          localField: "course",
          foreignField: "_id",
          as: "course",
        },
      },
      { $unwind: { path: "$course", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "applications",
          localField: "applicationId",
          foreignField: "applicationNumber",
          as: "application",
        },
      },
      { $unwind: { path: "$application", preserveNullAndEmptyArrays: true } },

      { $sort: { createdAt: -1 } },
    ];

    const data = await Visa.aggregate(pipeline);

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




exports.getUserVisaProcessing = async (req, res) => {
  try {
    const pipeline = [

      { $match: { userId: req.user._id } },

      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "courses",
          localField: "course",
          foreignField: "_id",
          as: "course",
        },
      },
      { $unwind: { path: "$course", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "applications",
          localField: "applicationId",
          foreignField: "applicationNumber",
          as: "application",
        },
      },
      { $unwind: { path: "$application", preserveNullAndEmptyArrays: true } },

      { $sort: { createdAt: -1 } },

      {
        $project: {
          applicationId: 1,
          country: 1,
          currentStep: 1,
          steps: 1,
          createdAt: 1,
          course: 1,
          application : 1,
          user: 1,
          documents: 1
        },
      },
    ];

    const data = await Visa.aggregate(pipeline);

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
    
// const slugify = (text) =>
//     text
//         .toString()
//         .toLowerCase()
//         .trim()
//         .replace(/\s+/g, '-')
//         .replace(/[^\w\-]+/g, '')
//         .replace(/\-\-+/g, '-')


    const data = await Visa.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

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



exports.deleteVisaProcessing = async (req, res) => {
  try {
    const data = await Visa.findByIdAndDelete(req.params.id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Visa processing not found",
      });
    }

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


exports.createDocumentRequirement = async (req, res) => {
  try {
    const {
      visaId,
      documentType,
      description,
      isRequired = true,
    } = req.body;

    const visa = await Visa.findById(visaId);

    if (!visa) {
      return res.status(404).json({
        success: false,
        message: "Visa processing not found",
      });
    }

    if (!visa.documents) {
      visa.documents = [];
    }

    const exists = visa.documents.some(
      (doc) =>
        doc.documentType.toLowerCase() === documentType.toLowerCase()
    );

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Document requirement already exists",
      });
    }

    const requirement = {
      documentType,
      description,
      isRequired,
      // status,
      createdAt: new Date(),
    };

    visa.documents.push(requirement);

    await visa.save();

    return res.status(201).json({
      success: true,
      data: requirement,
      message: "Document requirement created successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.uploadDocument = async (req, res) => {
  try {
    const { visaId, documentType } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const visa = await Visa.findById(visaId);

    if (!visa) {
      return res.status(404).json({
        success: false,
        message: "Visa processing not found",
      });
    }

    visa.documents = visa.documents || [];
    visa.documents = visa.documents || [];

    const documentData = {
      documentType,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      fileUrl: `/uploads/docs/${req.file.filename}`,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedAt: new Date(),
      status: "uploaded",
    };

    const existingDocIndex = visa.documents.findIndex(
      (doc) => doc.documentType === documentType
    );

    if (existingDocIndex > -1) {
      visa.documents[existingDocIndex] = documentData;
    } else {
      visa.documents.push(documentData);
    }

    const requirement = visa.documents.find(
      (doc) => doc.documentType === documentType
    );

    if (requirement) {
      requirement.status = "uploaded";
      requirement.uploadedAt = new Date();
    } else {
      visa.documents.push({
        documentType,
        description: "",
        isRequired: false,
        status: "uploaded",
        uploadedAt: new Date(),
      });
    }

    await visa.save();

    return res.status(200).json({
      success: true,
      data: documentData,
      message: "Document uploaded successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getDocuments = async (req, res) => {
  try {
    const visa = await Visa.findById(req.params.id);

    if (!visa) {
      return res.status(404).json({
        success: false,
        message: "Visa processing not found",
      });
    }

    const requirements = (visa.documents || []).map(
      (requirement) => {
        const uploadedDoc = (visa.documents || []).find(
          (doc) => doc.documentType === requirement.documentType
        );

        return {
          ...requirement.toObject(),
          uploaded: !!uploadedDoc,
          document: uploadedDoc || null,
        };
      }
    );

    const uploadedCount = requirements.filter(
      (item) => item.uploaded
    ).length;

    return res.status(200).json({
      success: true,
      data: {
        requirements,
        documents: visa.documents || [],
        totalRequirements: requirements.length,
        uploadedCount,
        pendingCount: requirements.length - uploadedCount,
        completionPercentage:
          requirements.length > 0
            ? Math.round(
                (uploadedCount / requirements.length) * 100
              )
            : 0,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


exports.deleteDocument = async (req, res) => {
  try {
    const { id, documentId } = req.params;

    const visa = await Visa.findById(id);

    if (!visa) {
      return res.status(404).json({
        success: false,
        message: "Visa processing not found",
      });
    }

    visa.documents = visa.documents || [];
    visa.documents = visa.documents || [];

    const documentIndex = visa.documents.findIndex(
      (doc) => doc._id.equals(documentId)
    );

    if (documentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    const deletedDocument = visa.documents[documentIndex];

    visa.documents.splice(documentIndex, 1);

    const requirement = visa.documents.find(
      (doc) => doc._id.equals(documentId)
    );

    if (requirement) {
      requirement.status = "pending";
      requirement.uploadedAt = null;
    }

    await visa.save();

    return res.status(200).json({
      success: true,
      data: deletedDocument,
      message: "Document deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

