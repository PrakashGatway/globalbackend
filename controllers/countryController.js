const Country = require('../models/Country')

exports.getCountries = async (req, res) => {
  try {
    let {
      search,
      status,
      page = 1,
      limit = 10,
      sort = '-createdAt',
    } = req.query

    page = Number(page)
    limit = Number(limit)

    const matchStage = {}

    if (search && search.trim()) {
      matchStage.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { currency: { $regex: search, $options: 'i' } },
      ]
    }

    if (status) {
      matchStage.status = status
    }

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

    const result = await Country.aggregate(pipeline)

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
  try {
    const country = await Country.create(req.body)
    res.status(201).json({
      success: true,
      message: 'Country created successfully',
    })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Country name or code already exists',
      })
    }
    res.status(500).json({ success: false, message: error.message })
  }
}

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

