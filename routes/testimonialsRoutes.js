const express = require('express')
const router = express.Router()

const {
  createTestimonial,
  getAllTestimonials,
  getTestimonialById,
  updateTestimonial,
  deleteTestimonial,
  getTestimonialStats, createFaq,
  getFaqs,
  getPublicFaqs,
  updateFaq,
  deleteFaq,
  createGallery,
  getGalleries,
  getGalleryById,
  updateGallery,
  deleteGallery,
  getPublicGallery,
} = require('../controllers/testimonialsController')

router.post('/galleries', createGallery);
router.get('/galleries', getGalleries);
router.get('/galleries/:id', getGalleryById);
router.put('/galleries/:id', updateGallery);
router.delete('/galleries/:id', deleteGallery);
router.get('/galleries/public/list', getPublicGallery);

router.post('/faqs', createFaq);
router.get('/faqs', getFaqs);
router.put('/faqs/:id', updateFaq);
router.delete('/faqs/:id', deleteFaq);
router.get('/faqs/public/list', getPublicFaqs);




// Public (Website)
router.get('/testimonials', getAllTestimonials)
router.get('/testimonials/:id', getTestimonialById)

// Admin
router.post('/testimonials', createTestimonial)
router.put('/testimonials/:id', updateTestimonial)
router.delete('/testimonials/:id', deleteTestimonial)
router.get('/testimonials/stats/dashboard', getTestimonialStats)

module.exports = router
