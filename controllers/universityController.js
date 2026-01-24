const University = require('../models/University')
const { paginate } = require('../utils/pagination')

// @desc    Get all universities
// @route   GET /api/universities?page=1&limit=10&sortBy=createdAt&sortOrder=desc
// @access  Private
exports.getUniversities = async (req, res) => {
  try {
    const { data, pagination } = await paginate(University, {}, req)
    
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

// @desc    Get single university
// @route   GET /api/universities/:id
// @access  Private
exports.getUniversity = async (req, res) => {
  try {
    const university = await University.findById(req.params.id)
    if (!university) {
      return res.status(404).json({ success: false, message: 'University not found' })
    }
    res.json({ success: true, data: university })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Create university
// @route   POST /api/universities
// @access  Private
exports.createUniversity = async (req, res) => {
  try {
    const { name, country, city, description, status } = req.body

    // Validate required fields
    if (!name || !country || !city) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, country, and city',
      })
    }

    // Create university
    const university = await University.create({
      name,
      country,
      city,
      description,
      status: status || 'Active',
    })

    res.status(201).json({
      success: true,
      message: 'University created successfully',
      data: university,
    })
  } catch (error) {
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

// @desc    Update university
// @route   PUT /api/universities/:id
// @access  Private
exports.updateUniversity = async (req, res) => {
  try {
    const university = await University.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })

    if (!university) {
      return res.status(404).json({ success: false, message: 'University not found' })
    }

    res.json({ success: true, data: university })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Delete university
// @route   DELETE /api/universities/:id
// @access  Private
exports.deleteUniversity = async (req, res) => {
  try {
    const university = await University.findByIdAndDelete(req.params.id)
    if (!university) {
      return res.status(404).json({ success: false, message: 'University not found' })
    }
    res.json({ success: true, message: 'University deleted successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
