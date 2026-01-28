const PageInformation = require('../models/PageInformation')
const { paginate } = require('../utils/pagination')

// Destination page types
const DESTINATION_TYPES = [
  'ivy_league',
  'usa_universities',
  'uk_universities',
  'germany_public_universities',
  'italy_france',
  'canada_australia',
  'other'
]

// @desc    Get all destination pages
// @route   GET /api/destinations
// @access  Public
exports.getDestinations = async (req, res) => {
  try {
    const pages = await PageInformation.find({
      pageType: { $in: DESTINATION_TYPES }
    }).sort({ pageType: 1 })

    res.json({
      success: true,
      count: pages.length,
      data: pages
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Get destination page by type
// @route   GET /api/destinations/:type
// @access  Public
exports.getDestinationByType = async (req, res) => {
  try {
    const { type } = req.params
    
    if (!DESTINATION_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid destination type'
      })
    }

    const page = await PageInformation.findOne({ pageType: type })
    
    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Destination page not found'
      })
    }

    res.json({
      success: true,
      data: page
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Update destination page
// @route   PUT /api/destinations/:id
// @access  Private
exports.updateDestination = async (req, res) => {
  try {
    const page = await PageInformation.findById(req.params.id)

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Destination page not found'
      })
    }

    if (!DESTINATION_TYPES.includes(page.pageType)) {
      return res.status(400).json({
        success: false,
        message: 'This is not a destination page'
      })
    }

    // Use the existing PageInformation update logic or simplified version
    const updatedPage = await PageInformation.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    )

    res.json({
      success: true,
      data: updatedPage
    })
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message)
      return res.status(400).json({
        success: false,
        message: `Validation error: ${messages.join(', ')}`,
        errors: messages,
      })
    }
    res.status(500).json({ success: false, message: error.message })
  }
}
