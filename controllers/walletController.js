const Wallet = require('../models/Wallet')
const { paginate } = require('../utils/pagination')

// @desc    Get all wallets
// @route   GET /api/wallets?page=1&limit=10&sortBy=createdAt&sortOrder=desc
// @access  Private
exports.getWallets = async (req, res) => {
  try {
    const { data, pagination } = await paginate(
      Wallet,
      {},
      req,
      { populate: { path: 'userId', select: 'name email' } }
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

// @desc    Get wallet by user ID
// @route   GET /api/wallets/user/:userId?page=1&limit=10
// @access  Private
exports.getWalletsByUser = async (req, res) => {
  try {
    const { data, pagination } = await paginate(
      Wallet,
      { userId: req.params.userId },
      req
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

// @desc    Create wallet
// @route   POST /api/wallets
// @access  Private
exports.createWallet = async (req, res) => {
  try {
    const wallet = await Wallet.create(req.body)
    res.status(201).json({ success: true, data: wallet })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Update wallet
// @route   PUT /api/wallets/:id
// @access  Private
exports.updateWallet = async (req, res) => {
  try {
    const wallet = await Wallet.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })

    if (!wallet) {
      return res.status(404).json({ success: false, message: 'Wallet not found' })
    }

    res.json({ success: true, data: wallet })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Delete wallet
// @route   DELETE /api/wallets/:id
// @access  Private
exports.deleteWallet = async (req, res) => {
  try {
    const wallet = await Wallet.findByIdAndDelete(req.params.id)
    if (!wallet) {
      return res.status(404).json({ success: false, message: 'Wallet not found' })
    }
    res.json({ success: true, message: 'Wallet deleted successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
