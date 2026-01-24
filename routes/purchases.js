const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const {
  purchaseCourse,
  getPurchases,
  getMyPurchases,
  getPurchase,
} = require('../controllers/purchaseController')

// Routes
router.post('/', protect, purchaseCourse)
router.get('/my-purchases', protect, getMyPurchases)
router.get('/', protect, getPurchases)
router.get('/:id', protect, getPurchase)

module.exports = router
