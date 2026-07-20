const { default: mongoose, isObjectIdOrHexString } = require('mongoose')

const Testimonial = require('../models/Testimonials')
const Faqs = require('../models/Faqs')
const Gallery = require('../models/Gallery')


exports.createTestimonial = async (req, res) => {
  try {
    const testimonial = await Testimonial.create(req.body)

    res.status(201).json({
      success: true,
      message: 'Testimonial created successfully',
      data: testimonial,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    })
  }
}

exports.getAllTestimonials = async (req, res) => {
  try {
    let {
      search,
      type,
      status,
      isFeatured,
      rating,
      page = 1,
      limit = 10,
      isAdmin = false,
      sort = '-createdAt',
    } = req.query

    // 🔧 Ensure numbers
    page = Number(page)
    limit = Number(limit)

    const matchStage = {}

    // 🔍 SEARCH (safe regex)
    if (search && search.trim()) {
      matchStage.$or = [
        { name: { $regex: search, $options: 'i' } },
        { university: { $regex: search, $options: 'i' } },
        { designation: { $regex: search, $options: 'i' } },
      ]
    }

    // 🎯 FILTERS
    if (type) matchStage.type = type
    if (status) matchStage.status = status
    if (rating) matchStage.rating = Number(rating)

    // ⚠️ isFeatured FIX (this was breaking your logic)
    if (isFeatured === 'true') matchStage.isFeatured = true
    if (isFeatured === 'false') matchStage.isFeatured = false

    // 🔃 SORT FIX
    const sortStage = {}
    if (sort) {
      if (sort.startsWith('-')) {
        sortStage[sort.slice(1)] = -1
      } else {
        sortStage[sort] = 1
      }
    } else {
      sortStage.createdAt = -1
    }

    const contentProject = isAdmin ? {} : { content: 0 }

    const pipeline = [
      { $match: matchStage },

      {
        $facet: {
          data: [
            { $sort: sortStage },
            { $skip: (page - 1) * limit },
            { $limit: limit },
            {
              $project: {
                ...contentProject,
                __v: 0,
                updatedAt: 0
              },
            }
          ],
          totalCount: [
            { $count: 'count' },
          ],
        },
      },
    ]

    const result = await Testimonial.aggregate(pipeline)

    const data = result[0]?.data || []
    const total = result[0]?.totalCount?.[0]?.count || 0

    res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      data,
    })
  } catch (error) {
    console.error('Get Testimonials Error:', error)
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

exports.getTestimonialById = async (req, res) => {
  try {
    const isMongoseId = mongoose.Types.ObjectId.isValid(req.params.id)
    const testimonial = await Testimonial.findOne(isMongoseId ? { _id: new mongoose.Types.ObjectId(req.params.id) } : { target: req.params.id })

    if (!testimonial) {
      return res.status(404).json({
        success: false,
        message: 'Testimonial not found',
      })
    }

    res.status(200).json({
      success: true,
      data: testimonial,
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

exports.updateTestimonial = async (req, res) => {
  try {
    const updated = await Testimonial.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Testimonial not found',
      })
    }

    res.status(200).json({
      success: true,
      message: 'Testimonial updated successfully',
      data: updated,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    })
  }
}

exports.deleteTestimonial = async (req, res) => {
  try {
    const deleted = await Testimonial.findByIdAndDelete(req.params.id)

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Testimonial not found',
      })
    }

    res.status(200).json({
      success: true,
      message: 'Testimonial deleted successfully',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}


exports.getTestimonialStats = async (req, res) => {
  try {
    const stats = await Testimonial.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ])

    const featuredCount = await Testimonial.countDocuments({
      isFeatured: true,
      status: 'Approved',
    })

    res.status(200).json({
      success: true,
      statusStats: stats,
      featuredCount,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

/**
 * CREATE FAQ
 */
exports.createFaq = async (req, res) => {
  try {
    const faq = await Faqs.create(req.body);

    res.status(201).json({
      success: true,
      data: faq,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET ALL FAQS (Admin)
 */
exports.getFaqs = async (req, res) => {
  try {
    const {
      type,
      search,
      status,
      isPublished,
      referenceModel,
      referenceId,
      page = 1,
      limit = 20,
    } = req.query;

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const matchStage = {};

    if (type) matchStage.type = type;
    if (status) matchStage.status = status;

   if (isPublished === 'true') {
  matchStage.isPublished = true;
} else if (isPublished === 'false') {
  matchStage.isPublished = false;
}

    if (referenceModel) matchStage.referenceModel = referenceModel;
    if (referenceId) matchStage.referenceId = referenceId;

    if (search && search.trim()) {
      matchStage.$or = [
        { question: { $regex: search, $options: 'i' } },
        { answer: { $regex: search, $options: 'i' } },
        { type: { $regex: search, $options: 'i' } },
      ];
    }

    const pipeline = [
      { $match: matchStage },

      {
        $facet: {
          data: [
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limitNumber },
          ],
          totalCount: [
            { $count: "count" }
          ]
        }
      }
    ];

    const result = await Faqs.aggregate(pipeline);

    const faqs = result[0].data;
    const total = result[0].totalCount[0]?.count || 0;

    res.status(200).json({
      success: true,
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(total / limitNumber),
      count: faqs.length,
      data: faqs,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET PUBLIC FAQS
 */
exports.getPublicFaqs = async (req, res) => {
  try {
    const { type, referenceModel, referenceId } = req.query;

    const filter = {
      status: 'Active',
      isPublished: true,
    };

    if (type) filter.type = type;
    // if (referenceModel) filter.referenceModel = referenceModel;
    // if (referenceId) filter.referenceId = referenceId;

    const faqs = await Faqs.find(filter)
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: faqs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * UPDATE FAQ
 */
exports.updateFaq = async (req, res) => {
  try {
    const faq = await Faqs.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found',
      });
    }

    res.status(200).json({
      success: true,
      data: faq,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * DELETE FAQ
 */
exports.deleteFaq = async (req, res) => {
  try {
    const faq = await Faqs.findByIdAndDelete(req.params.id);

    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'FAQ deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.createGallery = async (req, res) => {
  try {
    const gallery = await Gallery.create(req.body);

    res.status(201).json({
      success: true,
      data: gallery,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET ALL GALLERY ITEMS (Admin)
 */
exports.getGalleries = async (req, res) => {
  try {
    const { type, status, isPublished, mediaType } = req.query;

    const filter = {};

    if (type) filter.type = type;
    if (status) filter.status = status;
    if (mediaType) filter.mediaType = mediaType;
    if (isPublished && isPublished !== undefined && isPublished !== null) filter.isPublished = isPublished == 'true' ? true : "";

    const galleries = await Gallery.find(filter)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: galleries.length,
      data: galleries,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET SINGLE GALLERY ITEM
 */
exports.getGalleryById = async (req, res) => {
  try {
    const gallery = await Gallery.findById(req.params.id);

    if (!gallery) {
      return res.status(404).json({
        success: false,
        message: 'Gallery item not found',
      });
    }

    res.status(200).json({
      success: true,
      data: gallery,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * UPDATE GALLERY ITEM
 */
exports.updateGallery = async (req, res) => {
  try {
    const gallery = await Gallery.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!gallery) {
      return res.status(404).json({
        success: false,
        message: 'Gallery item not found',
      });
    }

    res.status(200).json({
      success: true,
      data: gallery,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * DELETE GALLERY ITEM
 */
exports.deleteGallery = async (req, res) => {
  try {
    const gallery = await Gallery.findByIdAndDelete(req.params.id);

    if (!gallery) {
      return res.status(404).json({
        success: false,
        message: 'Gallery item not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Gallery item deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET PUBLIC GALLERY (Frontend)
 */
exports.getPublicGallery = async (req, res) => {
  try {
    const { type, mediaType, isFeatured,limit=10 } = req.query;

    const filter = {
      status: 'Active',
      isPublished: true,
    };

    if (type) filter.type = type;
    if (mediaType) filter.mediaType = mediaType;
    if (isFeatured !== undefined) filter.isFeatured = isFeatured;

    const galleries = await Gallery.find(filter).limit(Number(limit))
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: galleries,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
