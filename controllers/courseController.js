const Course = require('../models/Course')
const { paginate } = require('../utils/pagination')

// @desc    Get all courses
// @route   GET /api/courses?page=1&limit=10&sortBy=createdAt&sortOrder=desc
// @access  Private
exports.getCourses = async (req, res) => {
  try {
    const { data, pagination } = await paginate(
      Course,
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

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Private
exports.getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('university')
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' })
    }
    res.json({ success: true, data: course })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Create course
// @route   POST /api/courses
// @access  Private
exports.createCourse = async (req, res) => {
  try {
    const { name, code, university, duration, price, description, status } = req.body

    // Validate required fields
    if (!name || !code || !university || !duration || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, code, university, duration, and price',
      })
    }

    // Validate price
    if (price < 0) {
      return res.status(400).json({
        success: false,
        message: 'Price cannot be negative',
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

    // Create course
    const course = await Course.create({
      name,
      code,
      university,
      duration,
      price,
      description,
      status: status || 'Active',
    })

    // Populate university name for response
    await course.populate('university', 'name')

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: course,
    })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Course code already exists. Please use a different code',
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

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private
exports.updateCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' })
    }

    res.json({ success: true, data: course })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id)
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' })
    }
    res.json({ success: true, message: 'Course deleted successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
