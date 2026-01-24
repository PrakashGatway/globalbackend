const Country = require('../models/Country')
const { paginate } = require('../utils/pagination')

// @desc    Get all countries
// @route   GET /api/countries?page=1&limit=10&sortBy=createdAt&sortOrder=desc
// @access  Private
exports.getCountries = async (req, res) => {
  try {
    const { data, pagination } = await paginate(Country, {}, req)
    
    res.json({
      success: true,
      count: pagination.totalItems,
      pagination,
      data,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Get single country
// @route   GET /api/countries/:id
// @access  Private
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

// @desc    Create country
// @route   POST /api/countries
// @access  Private
exports.createCountry = async (req, res) => {
  try {
    const { name, code, currency, status } = req.body

    // Validate required fields
    if (!name || !code || !currency) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, code, and currency',
      })
    }

    // Validate country code format (should be 2-3 characters)
    if (code.length < 2 || code.length > 3) {
      return res.status(400).json({
        success: false,
        message: 'Country code must be 2-3 characters long',
      })
    }

    // Create country
    const country = await Country.create({
      name,
      code: code.toUpperCase(),
      currency,
      status: status || 'Active',
    })

    res.status(201).json({
      success: true,
      message: 'Country created successfully',
      data: country,
    })
  } catch (error) {
    if (error.code === 11000) {
      // Check which field caused the duplicate error
      if (error.keyPattern?.name) {
        return res.status(400).json({
          success: false,
          message: 'Country name already exists. Please use a different name',
        })
      }
      if (error.keyPattern?.code) {
        return res.status(400).json({
          success: false,
          message: 'Country code already exists. Please use a different code',
        })
      }
      return res.status(400).json({
        success: false,
        message: 'Country name or code already exists',
      })
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message)
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages,
      })
    }
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Update country
// @route   PUT /api/countries/:id
// @access  Private
exports.updateCountry = async (req, res) => {
  try {
    const country = await Country.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })

    if (!country) {
      return res.status(404).json({ success: false, message: 'Country not found' })
    }

    res.json({ success: true, data: country })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Delete country
// @route   DELETE /api/countries/:id
// @access  Private
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
