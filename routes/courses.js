const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
} = require('../controllers/courseController')

// Routes
router.get('/', protect, getCourses)
router.get('/:id', protect, getCourse)
router.post('/', protect, createCourse)
router.put('/:id', protect, updateCourse)
router.delete('/:id', protect, deleteCourse)

module.exports = router
