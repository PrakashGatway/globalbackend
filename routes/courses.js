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


router.post("/categories", createCategory);
router.get("/categories", getAllCategories);
router.get("/categories/:id", getCategoryById);
router.put("/categories/:id", updateCategory);
router.delete("/categories/:id", deleteCategory);

router.get("/content-list",getExtraContentWithCourse)
router.post('/', createCourse)
router.get('/', getAllCourses)
router.get('/:id', getCourseById)
router.put('/:id', updateCourse)
router.delete('/:id', deleteCourse)


module.exports = router
