const Testimonial = require('../models/Testimonials')

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

    const pipeline = [
      { $match: matchStage },

      {
        $facet: {
          data: [
            { $sort: sortStage },
            { $skip: (page - 1) * limit },
            { $limit: limit },
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
    const testimonial = await Testimonial.findById(req.params.id)

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

