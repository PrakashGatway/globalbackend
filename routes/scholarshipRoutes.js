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

/* ---------- Public Routes ---------- */
router.get('/public/list', getPublicScholarships);
router.get('/slug/:slug', getScholarshipBySlug);

/* ---------- Admin Routes ---------- */
router.post('/', createScholarship);
router.get('/', getScholarships);
router.get('/:id', getScholarshipById);
router.put('/:id', updateScholarship);
router.delete('/:id', deleteScholarship);

module.exports = router;
