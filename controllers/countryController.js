const Country = require('../models/Country')
const CountryExtradetails = require('../models/CountryExtradetails')
const mongoose = require('mongoose')


// exports.getCountries = async (req, res) => {
//   try {
//     let {
//       search,
//       status,
//       isFeatured,
//       populateExtra,
//       extraStatus,
//       page = 1,
//       limit = 10,
//       code,
//       sort = "-createdAt",
//     } = req.query;

//     page = Number(page);
//     limit = Number(limit);
//     const matchStage = {};
//     const userId = req.body._id;
    
//     // Search filter
//     if (search && search.trim()) {
//       matchStage.$or = [
//         { name: { $regex: search, $options: "i" } },
//         { code: { $regex: search, $options: "i" } },
//         { currency: { $regex: search, $options: "i" } },
//       ];
//     }

//     // Status filter
//     if (status) {
//       matchStage.status = status;
//     }
//     if(code) {
//       matchStage.code = code;
//     }
//     // Featured filter
//     if (isFeatured !== undefined) {
//       matchStage.isFeatured = isFeatured;
//     }

//     // Sort configuration
//     const sortStage = {};

//     if (sort) {
//       if (sort.startsWith("-")) {
//         sortStage[sort.slice(1)] = -1;
//       } else {
//         sortStage[sort] = 1;
//       }
//     } else {
//       sortStage.createdAt = -1;
//     }

//     const shouldPopulate = populateExtra === "true";

//     // Data pipeline
//     const dataPipeline = [
//       { $sort: sortStage },
//       { $skip: (page - 1) * limit },
//       { $limit: limit },
//     ];

//     // Populate extra_content
//     if (shouldPopulate) {
//       dataPipeline.push({
//         $lookup: {
//           from: "countryextradetails",
//           localField: "extra_content",
//           foreignField: "_id",
//           as: "extra_content",
//         },
//       });

      
//       // dataPipeline.push({
//       //   $lookup: {
//       //     from: "userprofiles",
//       //     localField: "shortList",
//       //     foreignField: "_id",
//       //     as: "extra_content",
//       //   },
//       // });

//       // Filter extra content by status
//       if (extraStatus) {
//         dataPipeline.push({
//           $addFields: {
//             extra_content: {
//               $filter: {
//                 input: "$extra_content",
//                 as: "item",
//                 cond: {
//                   $eq: ["$$item.status", extraStatus],
//                 },
//               },
//             },
//           },
//         });
//       }
//     }


//     // Remove __v
//     dataPipeline.push({
//       $project: {
//         __v: 0,
//         "extra_content.__v": 0,
//       },
//     });

//     const pipeline = [
//       { $match: matchStage },
//       {
//         $facet: {
//           data: dataPipeline,
//           totalCount: [{ $count: "count" }],
//         },
//       },
//     ];

//     // console.log("pipeline", JSON.stringify(pipeline, null, 2));

//     const result = await Country.aggregate(pipeline);

//     const data = result[0]?.data || [];
//     const total = result[0]?.totalCount?.[0]?.count || 0;

//     res.status(200).json({
//       success: true,
//       total,
//       page,
//       pages: Math.ceil(total / limit),
//       limit,
//       data,
//     });
//   } catch (error) {
//     console.error("Get Countries Error:", error);

//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

exports.getCountries = async (req, res) => {
  try {
    let {
      search,
      status,
      isFeatured,
      populateExtra,
      extraStatus,
      page = 1,
      limit = 10,
      code,
      sort = "-createdAt",
    } = req.query;

    page = Number(page);
    limit = Number(limit);

    const userId = req.user?._id;

    const matchStage = {};

    // Search filter
    if (search && search.trim()) {
      matchStage.$or = [
        { name: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
        { currency: { $regex: search, $options: "i" } },
      ];
    }

    // Status filter
    if (status) {
      matchStage.status = status;
    }

    // Code filter
    if (code) {
      matchStage.code = code;
    }

    // Featured filter
    if (isFeatured !== undefined) {
      matchStage.isFeatured = isFeatured;
    }

    // Sort
    const sortStage = {};

    if (sort) {
      if (sort.startsWith("-")) {
        sortStage[sort.slice(1)] = -1;
      } else {
        sortStage[sort] = 1;
      }
    } else {
      sortStage.createdAt = -1;
    }

    const shouldPopulate =
      populateExtra === "true" || populateExtra === true;

    const dataPipeline = [
      { $match: matchStage },
      { $sort: sortStage },
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ];

    // Populate extra_content
    if (shouldPopulate) {
      dataPipeline.push({
        $lookup: {
          from: "countryextradetails",
          localField: "extra_content",
          foreignField: "_id",
          as: "extra_content",
        },
      });

      // convert array to object
      dataPipeline.push({
        $addFields: {
          extra_content: {
            $arrayElemAt: ["$extra_content", 0],
          },
        },
      });

      // filter extra content status
      if (extraStatus) {
        dataPipeline.push({
          $match: {
            "extra_content.status": extraStatus,
          },
        });
      }
    }

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
          "$code",
          {
            $ifNull: [
              {
                $arrayElemAt: [
                  "$shortList.otherDetails.countries_shortlist",
                  0,
                ],
              },
              [],
            ],
          },
        ],
      },
    },
  });

  // REMOVE SHORTLIST FROM THE FINAL OUTPUT
  dataPipeline.push({
    $project: {
      shortList: 0 // This hides shortList, keeping your original data + selected field
    }
  });
  
} else {
  dataPipeline.push({
    $addFields: {
      selected: false,
    },
  });
}




    // Remove __v
    dataPipeline.push({
      $project: {
        __v: 0,
        "extra_content.__v": 0,
      },
    });

    const pipeline = [
      {
        $facet: {
          data: dataPipeline,
          totalCount: [
            { $match: matchStage },
            { $count: "count" },
          ],
        },
      },
    ];

    const result = await Country.aggregate(pipeline);

    const data = result[0]?.data || [];
    const total = result[0]?.totalCount?.[0]?.count || 0;

    res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
      data,
    });

  } catch (error) {
    console.error("Get Countries Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getCountry = async (req, res) => {
  try {
    const country = await Country.findById(req.params.id)
    if (!country) {
      return res.status(404).json({ success: false, message: 'Country not found' })
    }
    res.json({ success: true, data: country })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.createCountry = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { extra_details, ...countryData } = req.body;

    // Create extra details (handle empty case)
    let extraDetails = null;
    if (extra_details && Object.keys(extra_details).length > 0) {
      extraDetails = await CountryExtradetails.create(
        [extra_details || {}],
        { session }
      );
    }

    // Create country with reference to extra details
    const country = await Country.create(
      [{
        ...countryData,
        extra_content: extraDetails ? extraDetails[0]._id : null
      }],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: 'Country created successfully',
      data: country[0]
    });
  } catch (error) {
    await session.abortTransaction(); // Use abortTransaction, not commitTransaction
    session.endSession();

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Country name or code already exists',
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// exports.updateCountry = async (req, res) => {
//   try {
//     const country = await Country.findByIdAndUpdate(
//       req.params.id,
//       req.body,
//       { new: true, runValidators: true }
//     )

//     if (!country) {
//       return res.status(404).json({ success: false, message: 'Country not found' })
//     }

//     res.json({
//       success: true,
//       message: 'Country updated successfully',
//       data: country,
//     })
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message })
//   }
// }


exports.deleteCountry = async (req, res) => {
  try {
    const country = await Country.findByIdAndDelete(req.params.id)
    if (!country) {
      return res.status(404).json({ success: false, message: 'Country not found' })
    }
    res.json({ success: true, message: 'Country deleted successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.updateCountry = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { extra_details, ...countryData } = req.body;

    // req.params.id = countryId,extraDetailsId
    const [countryId, extraDetailsId] = req.params.id.split(",");

    // Update extra details
    let updatedExtraDetails = null;

    if (extra_details && Object.keys(extra_details).length > 0) {
      if (extraDetailsId && extraDetailsId !== "null") {
        // update existing extra details
        updatedExtraDetails =
          await CountryExtradetails.findByIdAndUpdate(
            extraDetailsId,
            extra_details,
            {
              new: true,
              runValidators: true,
              session,
            }
          );
      } else {
        // create new extra details if not exist
        const createdExtraDetails =
          await CountryExtradetails.create(
            [extra_details],
            { session }
          );

        updatedExtraDetails = createdExtraDetails[0];
      }
    }

    // Update country
    const updatedCountry = await Country.findByIdAndUpdate(
      countryId,
      {
        ...countryData,
        ...(updatedExtraDetails && {
          extra_content: updatedExtraDetails._id,
        }),
      },
      {
        new: true,
        runValidators: true,
        session,
      }
    );

    if (!updatedCountry) {
      await session.abortTransaction();
      session.endSession();

      return res.status(404).json({
        success: false,
        message: "Country not found",
      });
    }

    await session.commitTransaction();
    session.endSession();

    // populate response
    const country = await Country.findById(updatedCountry._id)
      .populate("extra_content")
      .lean();

    res.status(200).json({
      success: true,
      message: "Country updated successfully",
      data: country,
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("Update Country Error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Country name or code already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};