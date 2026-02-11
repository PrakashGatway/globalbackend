const express = require('express');
const router = express.Router();

const {
  createUniversity,
  getAllUniversities,
  getUniversityById,
  updateUniversity,
  deleteUniversity
} = require('../controllers/universityController'); // Adjust path as needed
const { protect, authorize } = require('../middleware/auth');

// 🔓 Public routes
router.route('/')
  .get( getAllUniversities)
  .post(protect, authorize('admin', 'manager'), createUniversity); // Typically protected in production

router.route('/:id')
  .get(getUniversityById)
  .put(protect, authorize('admin', 'manager'), updateUniversity)    // Typically protected
  .delete(protect, authorize('admin', 'manager'), deleteUniversity); // Typically protected

module.exports = router;