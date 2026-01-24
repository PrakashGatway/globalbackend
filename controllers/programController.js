const Program = require('../models/Program')
const { paginate } = require('../utils/pagination')

// @desc    Get all programs
// @route   GET /api/programs?page=1&limit=10&sortBy=createdAt&sortOrder=desc
// @access  Private
exports.getPrograms = async (req, res) => {
  try {
    const { data, pagination } = await paginate(
      Program,
      {},
      req,
      { populate: { path: 'university', select: 'name' } }
    )
    
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

// @desc    Get single program
// @route   GET /api/programs/:id
// @access  Private
exports.getProgram = async (req, res) => {
  try {
    const program = await Program.findById(req.params.id).populate('university')
    if (!program) {
      return res.status(404).json({ success: false, message: 'Program not found' })
    }
    res.json({ success: true, data: program })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Create program
// @route   POST /api/programs
// @access  Private
exports.createProgram = async (req, res) => {
  try {
    const { name, type, university, duration, description, status } = req.body

    // Validate required fields
    if (!name || !type || !university || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, type, university, and duration',
      })
    }

    // Validate program type
    const validTypes = ['Undergraduate', 'Graduate', 'Doctorate', 'Certificate']
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Program type must be one of: ${validTypes.join(', ')}`,
      })
    }

    // Check if university exists
    const University = require('../models/University')
    const universityExists = await University.findById(university)
    if (!universityExists) {
      return res.status(404).json({
        success: false,
        message: 'University not found. Please provide a valid university ID',
      })
    }

    // Create program
    const program = await Program.create({
      name,
      type,
      university,
      duration,
      description,
      status: status || 'Active',
    })

    // Populate university name for response
    await program.populate('university', 'name')

    res.status(201).json({
      success: true,
      message: 'Program created successfully',
      data: program,
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

// @desc    Update program
// @route   PUT /api/programs/:id
// @access  Private
exports.updateProgram = async (req, res) => {
  try {
    const program = await Program.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })

    if (!program) {
      return res.status(404).json({ success: false, message: 'Program not found' })
    }

    res.json({ success: true, data: program })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Delete program
// @route   DELETE /api/programs/:id
// @access  Private
exports.deleteProgram = async (req, res) => {
  try {
    const program = await Program.findByIdAndDelete(req.params.id)
    if (!program) {
      return res.status(404).json({ success: false, message: 'Program not found' })
    }
    res.json({ success: true, message: 'Program deleted successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
