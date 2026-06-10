const mongoose = require("mongoose");
const Visa = require("../models/VisaProsesing");

const Countries = require("../models/Country")

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

    // 5. Construct the payload and insert the new Visa document
    const visaPayload = {
      ...req.body,
      // application: applicationId, 
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
          application: 1
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
          user: 1
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

exports.updateCurrentStep = async (req, res) => {
  try {
    const { currentStep } = req.body;

    const visa = await Visa.findById(req.params.id);

    if (!visa) {
      return res.status(404).json({
        success: false,
        message: "Visa processing not found",
      });
    }

    visa.currentStep = currentStep;
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