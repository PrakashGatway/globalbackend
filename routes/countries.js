const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const {
  getCountries,
  getCountry,
  createCountry,
  updateCountry,
  deleteCountry,
} = require('../controllers/countryController')

// Routes
router.get('/', protect, getCountries)
router.get('/:id', protect, getCountry)
router.post('/', protect, createCountry)
router.put('/:id', protect, updateCountry)
router.delete('/:id', protect, deleteCountry)

module.exports = router
