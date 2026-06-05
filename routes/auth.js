const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const {
  login,
  sendOTP,
  verifyOTP,
  getMe,
  updateProfile,
  getMyReferrals,
  createOrUpdateUserProfile,
  createOrUpdateUserProfileById,
  updateDoc,
  updateDocuments
} = require('../controllers/authController')

// Routes
router.get('/login', login)
router.post('/send-otp', sendOTP)
router.post('/verify-otp', verifyOTP)
router.get('/me', protect, getMe)
router.put('/profile', protect, updateProfile)
router.post("/profile_info", protect, createOrUpdateUserProfile)
router.post("/referral" , createOrUpdateUserProfileById)
router.get("/my-referrals", protect, getMyReferrals)
router.patch("/edit-doc",protect, updateDoc)
router.put('/updateDocuments/:userId/doc',updateDocuments);

module.exports = router