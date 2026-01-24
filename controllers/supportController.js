const Support = require('../models/Support')
const { paginate } = require('../utils/pagination')

// @desc    Get all support tickets
// @route   GET /api/support?page=1&limit=10&sortBy=createdAt&sortOrder=desc
// @access  Private
exports.getTickets = async (req, res) => {
  try {
    const { data, pagination } = await paginate(
      Support,
      {},
      req,
      { populate: { path: 'user', select: 'name email' } }
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

// @desc    Get single ticket
// @route   GET /api/support/:id
// @access  Private
exports.getTicket = async (req, res) => {
  try {
    const ticket = await Support.findById(req.params.id).populate('user', 'name email')
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' })
    }
    res.json({ success: true, data: ticket })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Create ticket
// @route   POST /api/support
// @access  Private
exports.createTicket = async (req, res) => {
  try {
    const ticket = await Support.create(req.body)
    res.status(201).json({ success: true, data: ticket })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Update ticket
// @route   PUT /api/support/:id
// @access  Private
exports.updateTicket = async (req, res) => {
  try {
    const ticket = await Support.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' })
    }

    res.json({ success: true, data: ticket })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Delete ticket
// @route   DELETE /api/support/:id
// @access  Private
exports.deleteTicket = async (req, res) => {
  try {
    const ticket = await Support.findByIdAndDelete(req.params.id)
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' })
    }
    res.json({ success: true, message: 'Ticket deleted successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
