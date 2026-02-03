const express = require('express');
const router = express.Router();

// Import controllers
const {
  createUniversity,
  getAllUniversities,
  getUniversityById,
  updateUniversity,
  deleteUniversity
} = require('../controllers/universityController'); // Adjust path as needed

// 🔓 Public routes
router.route('/')
  .get(getAllUniversities)
  .post(createUniversity); // Typically protected in production

router.route('/:id')
  .get(getUniversityById)
  .put(updateUniversity)    // Typically protected
  .delete(deleteUniversity); // Typically protected

module.exports = router;