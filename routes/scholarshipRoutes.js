const express = require('express');
const router = express.Router();

const {
  createScholarship,
  getScholarships,
  getScholarshipById,
  getScholarshipBySlug,
  updateScholarship,
  deleteScholarship,
  getPublicScholarships,
} = require('../controllers/scholarshipController');
const { protect, authorize } = require('../middleware/auth');

/* ---------- Public Routes ---------- */
router.get('/public/list', getPublicScholarships);
router.get('/slug/:slug', getScholarshipBySlug);

/* ---------- Admin Routes ---------- */
router.post('/', protect, authorize('admin', 'manager'), createScholarship);
router.get('/', protect, authorize('admin', 'manager'), getScholarships);
router.get('/:id', protect, authorize('admin', 'manager'), getScholarshipById);
router.put('/:id', protect, authorize('admin', 'manager'), updateScholarship);
router.delete('/:id', protect, authorize('admin', 'manager'), deleteScholarship);

module.exports = router;
