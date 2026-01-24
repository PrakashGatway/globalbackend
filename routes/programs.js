const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const {
  getPrograms,
  getProgram,
  createProgram,
  updateProgram,
  deleteProgram,
} = require('../controllers/programController')

// Routes
router.get('/', protect, getPrograms)
router.get('/:id', protect, getProgram)
router.post('/', protect, createProgram)
router.put('/:id', protect, updateProgram)
router.delete('/:id', protect, deleteProgram)

module.exports = router
