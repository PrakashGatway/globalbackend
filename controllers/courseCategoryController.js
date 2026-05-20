const CourseCategory = require("../models/CourseCategory");

// ✅ Create Category
exports.createCategory = async (req, res) => {
    try {
        const category = await CourseCategory.create(req.body);

        res.status(201).json({
            success: true,
            data: category,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};


// ✅ Get All Categories (with pagination)
exports.getAllCategories = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const userId = req.user?._id;

    const filter = {};

    // Search by name
    if (req.query.name) {
      filter.name = {
        $regex: req.query.name,
        $options: "i",
      };
    }

    // Active filter
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === "true";
    }

    // Sorting
    let sort = {};

    if (req.query.sort) {
      if (req.query.sort.startsWith("-")) {
        sort[req.query.sort.slice(1)] = -1;
      } else {
        sort[req.query.sort] = 1;
      }
    } else {
      sort.order = 1;
    }

    // Aggregation pipeline
    const dataPipeline = [
      { $match: filter },
      { $sort: sort },
      { $skip: skip },
      { $limit: limit },
    ];

    // User shortlist lookup
    if (userId) {
      dataPipeline.push({
        $lookup: {
          from: "userprofiles",
          pipeline: [
            {
              $match: {
                user: userId,
              },
            },
            {
              $project: {
                _id: 0,
                otherDetails: 1,
              },
            },
          ],
          as: "shortList",
        },
      });

      // selected true/false
      dataPipeline.push({
        $addFields: {
          selected: {
            $in: [
              "$_id",
              {
                $map: {
                  input: {
                    $ifNull: [
                      {
                        $arrayElemAt: [
                          "$shortList.otherDetails.categorie_shortlist",
                          0,
                        ],
                      },
                      [],
                    ],
                  },
                  as: "id",
                  in: {
                    $toObjectId: "$$id",
                  },
                },
              },
            ],
          },
        },
      });

      // Hide shortlist
      dataPipeline.push({
        $project: {
          shortList: 0,
        },
      });
    } else {
      dataPipeline.push({
        $addFields: {
          selected: false,
        },
      });
    }

    const pipeline = [
      {
        $facet: {
          data: dataPipeline,
          totalCount: [
            { $match: filter },
            { $count: "count" },
          ],
        },
      },
    ];

    const result = await CourseCategory.aggregate(pipeline);

    const categories = result[0]?.data || [];
    const total = result[0]?.totalCount?.[0]?.count || 0;

    res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      count: categories.length,
      data: categories,
    });

  } catch (error) {
    console.error("Get Categories Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


exports.getCategoryById = async (req, res) => {
    try {
        const category = await CourseCategory.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        res.status(200).json({
            success: true,
            data: category,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ✅ Update Category
exports.updateCategory = async (req, res) => {
    try {
        const category = await CourseCategory.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true,
            }
        );

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        res.status(200).json({
            success: true,
            data: category,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

// ✅ Delete Category (Soft Delete)
exports.deleteCategory = async (req, res) => {
    try {
        const category = await CourseCategory.findByIdAndDelete(
            req.params.id
        );
        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }
        res.status(200).json({
            success: true,
            message: "Category deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
