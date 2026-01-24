const Application = require('../models/Application')
const { paginate } = require('../utils/pagination')

// @desc    Get all applications
// @route   GET /api/applications?page=1&limit=10&sortBy=updatedAt&sortOrder=desc
// @access  Private
exports.getApplications = async (req, res) => {
  try {
    const { search, primaryStatus, university, course } = req.query
    
    // Build filter object
    const filter = {}
    
    if (search) {
      filter.$or = [
        { camsId: { $regex: search, $options: 'i' } },
        { studentName: { $regex: search, $options: 'i' } },
        { passportNo: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
      ]
    }
    
    if (primaryStatus) {
      filter.primaryStatus = primaryStatus
    }
    
    if (university) {
      filter.university = university
    }
    
    if (course) {
      filter.course = course
    }

    const { data, pagination } = await paginate(
      Application,
      filter,
      req,
      {
        populate: [
          { path: 'student', select: 'name email phone' },
          { path: 'university', select: 'name country city' },
          { path: 'course', select: 'name code' },
        ],
        sort: { updatedAt: -1 },
      }
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

// @desc    Get single application
// @route   GET /api/applications/:id
// @access  Private
exports.getApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('student', 'name email phone')
      .populate('university', 'name country city')
      .populate('course', 'name code price')

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' })
    }

    res.json({ success: true, data: application })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Create application
// @route   POST /api/applications
// @access  Private
exports.createApplication = async (req, res) => {
  try {
    const application = await Application.create(req.body)
    const populated = await Application.findById(application._id)
      .populate('student', 'name email phone')
      .populate('university', 'name country city')
      .populate('course', 'name code')

    res.status(201).json({ success: true, data: populated })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'CAMS ID already exists',
      })
    }
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Update application
// @route   PUT /api/applications/:id
// @access  Private
exports.updateApplication = async (req, res) => {
  try {
    const application = await Application.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate('student', 'name email phone')
      .populate('university', 'name country city')
      .populate('course', 'name code')

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' })
    }

    res.json({ success: true, data: application })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'CAMS ID already exists',
      })
    }
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Delete application
// @route   DELETE /api/applications/:id
// @access  Private/Admin
exports.deleteApplication = async (req, res) => {
  try {
    const application = await Application.findByIdAndDelete(req.params.id)

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' })
    }

    res.json({ success: true, message: 'Application deleted successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Download all student data
// @route   GET /api/applications/download/all
// @access  Private
exports.downloadAllApplications = async (req, res) => {
  try {
    const applications = await Application.find({})
      .populate('student', 'name email phone')
      .populate('university', 'name country city')
      .populate('course', 'name code')
      .sort({ updatedAt: -1 })

    res.json({
      success: true,
      count: applications.length,
      data: applications,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
