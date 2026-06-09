const User = require("../models/User");
const mongoose = require("mongoose");
const UserProfile = require("../models/UserProfile");

exports.createUser = async (req, res) => {
  try {

    if (req.user.role === "counsellor") {
      req.body.assignto = req.user._id;
      req.body.referalBy = req.user.referalCode;
    }
    const user = await User.create(req.body);

    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = "-createdAt",
      search,
      role,
      dateFrom,
      dateTo,
      status,
      assignto,
      intake,
      nationality
    } = req.query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const matchStage = {};

    if (role) matchStage.role = role;
    if (status) matchStage.status = status;

    if (assignto) matchStage.assignto = new mongoose.Types.ObjectId(assignto);
    if (intake) matchStage.intake = intake;
    if (nationality) matchStage.nationality = nationality;
    if (dateFrom) {
      const startDate = new Date(dateFrom);
      startDate.setHours(0, 0, 0, 0);

      matchStage.createdAt = {
        ...matchStage.createdAt,
        $gte: startDate,
      };
    }

    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);

      matchStage.createdAt = {
        ...matchStage.createdAt,
        $lte: endDate,
      };
    }

    if (req.user.role === "counsellor") {
      matchStage.assignto = req.user._id;
      matchStage.status = "Active";
      matchStage.role = "user";
    }
    if (search) {
      matchStage.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }
    const sortStage = {};
    if (sort.startsWith("-")) {
      sortStage[sort.substring(1)] = -1;
    } else {
      sortStage[sort] = 1;
    }

    const total = await User.countDocuments(matchStage);

    const users = await User.aggregate([
      { $match: matchStage },
      { $sort: sortStage },
      { $skip: skip },
      { $limit: limitNumber },
      {
        $lookup: {
          from: "userprofiles",
          localField: "_id",
          foreignField: "user",
          as: "profile",
          pipeline: [
            {
              $project: {
                _id: 0,
                profileCompletion: 1
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "assignto",
          foreignField: "_id",
          as: "assignee",
          pipeline: [
            {
              $project: {
                _id: 0,
                name: 1
              },
            },
          ],
        },
      },
      { $unwind: { path: "$assignee", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          localField: "referalBy",
          foreignField: "referalCode",
          as: "referby",
          pipeline: [
            {
              $project: {
                _id: 0,
                name: 1
              },
            },
          ],
        },
      },
      { $unwind: { path: "$referby", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          profile: {
            $cond: [
              { $gt: [{ $size: "$profile" }, 0] },
              { $arrayElemAt: ["$profile", 0] },
              {},
            ],
          },
        },
      },
      {
        $project: {
          password: 0,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        pages: Math.ceil(total / limitNumber),
      },
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    let profile = await UserProfile.findOne({ user: user._id })
    if (!profile) {
      profile = await UserProfile.create({ user: user._id })
    }
    res.status(200).json({
      success: true,
      data: user,
      profile
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const calculateProfileCompletion = (user, profile) => {
  let completion = 0;

  // Basic user details
  if (
    user?.firstName &&
    user?.lastName &&
    user?.email &&
    user?.phone
  ) {
    completion += 20;
  }

  // Current Address
  if (
    profile?.currentAddress?.addressLine1 &&
    profile?.currentAddress?.city &&
    profile?.currentAddress?.country
  ) {
    completion += 10;
  }

  // Permanent Address
  if (
    profile?.permanentAddress?.addressLine1 &&
    profile?.permanentAddress?.city &&
    profile?.permanentAddress?.country
  ) {
    completion += 10;
  }

  // Highest Academic
  if (
    profile?.highestAcademic?.countryOfEducation &&
    profile?.highestAcademic?.highestEducationLevel
  ) {
    completion += 10;
  }

  // Education History
  if (profile?.educationHistory?.length > 0) {
    completion += 15;
  }

  // Work Experience
  if (profile?.workExperience?.length > 0) {
    completion += 10;
  }

  // Tests (if any one exists)
  const hasTest =
    profile?.ielts ||
    profile?.toefl ||
    profile?.gre ||
    profile?.sat ||
    profile?.gmat ||
    profile?.pte;

  if (hasTest) {
    completion += 10;
  }

  // Preferences
  if (
    profile?.preferences &&
    (
      profile?.preferences?.preferredCountries?.length ||
      profile?.preferences?.preferredCourse?.length ||
      profile?.preferences?.preferredIntake?.length
    )
  ) {
    completion += 15;
  }

  return Math.min(completion, 100);
};


exports.updateUser = async (req, res) => {
  try {
    const {
      currentAddress,
      permanentAddress,
      educationHistory,
      highestAcademic,
      workExperience,
      ielts,
      toefl,
      gre,
      sat,
      gmat,
      pte,
      preferences,
      ...userData
    } = req.body;

    const user = await User.findByIdAndUpdate(req.params.id, userData, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const profileUpdate = {};

    if (currentAddress)
      profileUpdate.currentAddress = currentAddress;

    if (permanentAddress)
      profileUpdate.permanentAddress = permanentAddress;

    if (educationHistory)
      profileUpdate.educationHistory = educationHistory;

    if (highestAcademic)
      profileUpdate.highestAcademic = highestAcademic;

    if (workExperience)
      profileUpdate.workExperience = workExperience;

    if (ielts)
      profileUpdate.ielts = ielts;

    if (toefl)
      profileUpdate.toefl = toefl;

    if (gre)
      profileUpdate.gre = gre;

    if (sat)
      profileUpdate.sat = sat;

    if (gmat)
      profileUpdate.gmat = gmat;

    if (pte)
      profileUpdate.pte = pte;

    if (preferences)
      profileUpdate.preferences = preferences;

    if (Object.keys(profileUpdate).length > 0) {
      let profile = await UserProfile.findOneAndUpdate(
        { user: req.params.id },
        { $set: profileUpdate },
        { new: true, upsert: true }
      );
      const profileCompletion = calculateProfileCompletion(user, profile);

      profile.profileCompletion = profileCompletion;
      await profile.save();
    }
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: "Inactive" },
      { new: true },
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "User deactivated successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.userStats = async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: "$role",
          totalUsers: { $sum: 1 },
          totalWallet: { $sum: "$wallet" },
        },
      },
      {
        $project: {
          role: "$_id",
          totalUsers: 1,
          totalWallet: 1,
          _id: 0,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.monthlyRegistrations = async (req, res) => {
  try {
    const data = await User.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
    ]);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUsersWithProfile = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role, status } = req.query;

    const skip = (page - 1) * limit;

    const matchStage = {};

    if (role) matchStage.role = role;
    if (status) matchStage.status = status;

    if (search) {
      matchStage.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: "userprofiles", // collection name (important)
          localField: "_id",
          foreignField: "user",
          as: "profile",
        },
      },
      {
        $unwind: {
          path: "$profile",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          password: 0,
          "profile.passportNumber": 0, // optional security
        },
      },
      {
        $facet: {
          data: [
            { $sort: { createdAt: -1 } },
            { $skip: Number(skip) },
            { $limit: Number(limit) },
          ],
          pagination: [{ $count: "total" }],
        },
      },
    ];

    const result = await mongoose.model("User").aggregate(pipeline);

    const users = result[0].data;
    const total = result[0].pagination[0]?.total || 0;

    res.status(200).json({
      success: true,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit),
      },
      data: users,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateProfileDocumentStatus = async (req, res) => {
  try {
    const { student } = req.query;
    const { docKey, status, remarks } = req.body;

    const allowedStatuses = ["pending", "approved", "rejected"];

    if (!docKey) {
      return res.status(400).json({
        success: false,
        message: "Document key is required",
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${allowedStatuses.join(", ")}`,
      });
    }

    const profile = await UserProfile.findOne({
      user: student,
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    let documents = JSON.parse(profile.documents) || {};

    if (!documents[docKey]) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    documents[docKey].status = status;
    documents[docKey].remarks = remarks || "";
    documents[docKey].updatedBy = req.user?.name;
    documents[docKey].updatedAt = new Date();

    profile.documents = documents;

    await profile.save();

    return res.status(200).json({
      success: true,
      message: "Document status updated successfully",
      data: documents[docKey],
    });
  } catch (error) {
    console.error(error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update document status.",
      error: error.message,
    });
  }
};

exports.createDocumentRequirement = async (req, res) => {
  try {
    const { student } = req.query;
    const { docKey, docName, description, applicationId, isMandatory } = req.body;

    const profile = await UserProfile.findOne({
      user: new mongoose.Types.ObjectId(student)
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    let documents = JSON.parse(profile.documents || "{}");

    if (documents[docKey]) {
      return res.status(400).json({
        success: false,
        message: "Document already exists",
      });
    }

    documents[docKey] = {
      docKey,
      docName,
      description,
      type: isMandatory ? "mandatory" : "non-mandatory",
      status: "pending",
      applicationId: applicationId,
      requestedBy: req.user?.name,
      requestedAt: new Date()
    };

    profile.documents = documents;

    await profile.save();

    return res.status(200).json({
      success: true,
      message: "Document requirement added successfully",
      data: documents[docKey],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
