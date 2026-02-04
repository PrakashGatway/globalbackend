const express = require('express')
const router = express.Router()

const {
  createTestimonial,
  getAllTestimonials,
  getTestimonialById,
  updateTestimonial,
  deleteTestimonial,
  getTestimonialStats,
} = require('../controllers/testimonialsController')

// Public (Website)
router.get('/', getAllTestimonials)
router.get('/:id', getTestimonialById)

// Admin
router.post('/', createTestimonial)
router.put('/:id', updateTestimonial)
router.delete('/:id', deleteTestimonial)
router.get('/stats/dashboard', getTestimonialStats)

module.exports = router
