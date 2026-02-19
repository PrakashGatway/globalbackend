const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const {
  login,
  sendOTP,
  verifyOTP,
  getMe,
  updateProfile,
  getMyReferrals
} = require('../controllers/authController')

// Routes
router.get('/login', login)
router.post('/send-otp', sendOTP)
router.post('/verify-otp', verifyOTP)
router.get('/me', protect, getMe)
router.put('/profile', protect, updateProfile)
router.get("/my-referrals", protect, getMyReferrals)

module.exports = router