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
  getFaqTypes,
} = require('../controllers/testimonialsController');
const { authorize, protect } = require('../middleware/auth');

router.post('/galleries', protect, authorize('admin', 'manager'), createGallery);
router.get('/galleries', protect, authorize('admin', 'manager'), getGalleries);
router.get('/galleries/:id', protect, authorize('admin', 'manager'), getGalleryById);
router.put('/galleries/:id', protect, authorize('admin', 'manager'), updateGallery);
router.delete('/galleries/:id', protect, authorize('admin', 'manager'), deleteGallery);
router.get('/galleries/public/list', getPublicGallery);

router.post('/faqs', createFaq);
router.get('/faqs', getFaqs);
router.get('/faqs/types', getFaqTypes);
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
