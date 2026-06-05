const User = require("../models/User");
const mongoose = require("mongoose");

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

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
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

      // 🔗 Join UserProfile
      {
        $lookup: {
          from: "userprofiles", // collection name (important)
          localField: "_id",
          foreignField: "user",
          as: "profile",
        },
      },

      // 🧹 Convert array → object
      {
        $unwind: {
          path: "$profile",
          preserveNullAndEmptyArrays: true,
        },
      },

      // ❌ Remove sensitive fields
      {
        $project: {
          password: 0,
          "profile.passportNumber": 0, // optional security
        },
      },

      // 📦 Pagination + count
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
