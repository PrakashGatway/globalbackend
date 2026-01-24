const express = require('express')
const router = express.Router()
const { protect, admin } = require('../middleware/auth')
const {
  getCoupons,
  getCoupon,
  validateCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  incrementUsage,
} = require('../controllers/couponController')

// Routes
router.get('/', protect, getCoupons)
router.get('/:id', protect, getCoupon)
router.post('/validate', protect, validateCoupon)
router.post('/', protect, admin, createCoupon)
router.put('/:id', protect, admin, updateCoupon)
router.delete('/:id', protect, admin, deleteCoupon)
router.put('/:id/increment-usage', protect, incrementUsage)

module.exports = router
