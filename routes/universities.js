const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const {
  getUniversities,
  getUniversity,
  createUniversity,
  updateUniversity,
  deleteUniversity,
} = require('../controllers/universityController')

// Routes
router.get('/', protect, getUniversities)
router.get('universities/:id', protect, getUniversity)
router.post('/', protect, createUniversity)
router.put('/:id', protect, updateUniversity)
router.delete('/:id', protect, deleteUniversity)

module.exports = router
