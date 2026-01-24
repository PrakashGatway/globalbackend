const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const {
  getWallets,
  getWalletsByUser,
  createWallet,
  updateWallet,
  deleteWallet,
} = require('../controllers/walletController')

// Routes
router.get('/', protect, getWallets)
router.get('/user/:userId', protect, getWalletsByUser)
router.post('/', protect, createWallet)
router.put('/:id', protect, updateWallet)
router.delete('/:id', protect, deleteWallet)

module.exports = router
