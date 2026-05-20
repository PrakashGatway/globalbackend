const express = require('express')
const router = express.Router()

const {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  getExtraContentWithCourse,
} = require('../controllers/courseController')

const {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} = require("../controllers/courseCategoryController");
const { protect, authorize } = require('../middleware/auth');


router.post("/categories", protect, authorize('admin', 'manager'), createCategory);
router.get("/categories",protect, getAllCategories);
router.get("/categories/:id", protect, authorize('admin', 'manager'), getCategoryById);
router.put("/categories/:id", protect, authorize('admin', 'manager'), updateCategory);
router.delete("/categories/:id", protect, authorize('admin', 'manager'), deleteCategory);

router.get("/content-list", getExtraContentWithCourse)
router.post('/', protect, authorize('admin', 'manager'), createCourse)
router.get('/', getAllCourses)
router.get('/:id', getCourseById)
router.put('/:id', protect, authorize('admin', 'manager'), updateCourse)
router.delete('/:id', protect, authorize('admin', 'manager'), deleteCourse)


module.exports = router
