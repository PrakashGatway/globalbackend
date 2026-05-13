const Country = require('../models/Country')
const CountryExtradetails = require('../models/CountryExtradetails')
const mongoose = require('mongoose')

// exports.getCountries = async (req, res) => {
//   try {
//     let {
//       search,
//       status,
//       isFeatured,
//       page = 1,
//       limit = 10,
//       sort = '-createdAt',
//     } = req.query

//     page = Number(page)
//     limit = Number(limit)

//     const matchStage = {}

//     if (search && search.trim()) {
//       matchStage.$or = [
//         { name: { $regex: search, $options: 'i' } },
//         { code: { $regex: search, $options: 'i' } },
//         { currency: { $regex: search, $options: 'i' } },
//       ]
//     }

//     if (status) {
//       matchStage.status = status
//     }
//     if (isFeatured) {
//       matchStage.isFeatured = isFeatured
//     }

//     const sortStage = {}
//     if (sort) {
//       if (sort.startsWith('-')) {
//         sortStage[sort.slice(1)] = -1
//       } else {
//         sortStage[sort] = 1
//       }
//     } else {
//       sortStage.createdAt = -1
//     }

//     // 🧠 AGGREGATION PIPELINE
//     const pipeline = [
//       { $match: matchStage },

//       {
//         $facet: {
//           data: [
//             { $sort: sortStage },
//             { $skip: (page - 1) * limit },
//             { $limit: limit },
//           ],
//           totalCount: [{ $count: 'count' }],
//         },
//       },
//     ]

//     const result = await Country.aggregate(pipeline)

//     const data = result[0]?.data || []
//     const total = result[0]?.totalCount?.[0]?.count || 0

//     res.status(200).json({
//       success: true,
//       total,
//       page,
//       pages: Math.ceil(total / limit),
//       data,
//     })
//   } catch (error) {
//     console.error('Get Countries Error:', error)
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     })
//   }
// }


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
      sortBy = 'name',
      sortOrder = 'asc',
    } = req.query

    page = Number(page)
    limit = Number(limit)

    const matchStage = {}

    // Search filter
    if (search && search.trim()) {
      matchStage.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { currency: { $regex: search, $options: 'i' } },
      ]
    }

    // Status filter
    if (status) {
      matchStage.status = status
    }

    // Featured filter
    if (isFeatured) {
      matchStage.isFeatured = isFeatured
    }

    // Sort configuration
    const sortStage = {}
    const sortField = sortBy || 'name'
    const sortValue = sortOrder === 'desc' ? -1 : 1
    sortStage[sortField] = sortValue

    // 🧠 AGGREGATION PIPELINE
    const pipeline = [
      { $match: matchStage },
      {
        $facet: {
          data: [
            { $sort: sortStage },
            { $skip: (page - 1) * limit },
            { $limit: limit },
          ],
          totalCount: [{ $count: 'count' }],
        },
      },
    ]

    const shouldPopulate = populateExtra === 'true'

    if (shouldPopulate) {
      // Add lookup for extra details
      pipeline.push({
        $lookup: {
          from: 'countryextradetails', // Mongoose default collection name
          localField: 'extra_content',
          foreignField: '_id',
          as: 'extra_content'
        }
      })

      // Unwind the extra_content array
      pipeline.push({
        $unwind: {
          path: '$extra_content',
          preserveNullAndEmptyArrays: true
        }
      })

      if (extraStatus) {
        pipeline.push({
          $match: {
            'extra_content.status': extraStatus
          }
        })
      }

      pipeline.push({
        $project: {
          __v: 0,
          'extra_content.__v': 0
        }
      })
    } else {
      pipeline.push({
        $project: {
          __v: 0
        }
      })
    }

    const result = await Country.aggregate(pipeline)

    // Extract data and total count
    const data = result[0]?.data || []
    const total = result[0]?.totalCount?.[0]?.count || 0

    res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
      data,
    })
  } catch (error) {
    console.error('Get Countries Error:', error)
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

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

exports.updateCountry = async (req, res) => {
  try {
    const country = await Country.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )

    if (!country) {
      return res.status(404).json({ success: false, message: 'Country not found' })
    }

    res.json({
      success: true,
      message: 'Country updated successfully',
      data: country,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

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

