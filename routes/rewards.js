const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const {
  getMyRewards,
  getRewards,
  redeemPoints,
  updateConversionRate,
  getRewardStatistics,
} = require('../controllers/rewardController')

// Routes
router.get('/my-rewards', protect, getMyRewards)
router.get('/statistics', protect, getRewardStatistics)
router.get('/', protect, getRewards)
router.post('/redeem-points', protect, redeemPoints)
router.put('/conversion-rate', protect, updateConversionRate)

module.exports = router
