const express = require('express')
const router = express.Router()
const blogController = require('../controllers/blogController')

router.get('/categories', blogController.getBlogCategories)
router.post('/categories', /* protect, */ blogController.createCategory)
router.put('/categories/:id', /* protect, */ blogController.updateCategory)
router.delete('/categories/:id', /* protect, */ blogController.deleteCategory)

router.get('/', blogController.getAllBlogs)
router.get('/:slug', blogController.getBlogBySlug)
router.post('/', /* protect, */ blogController.createBlog)
router.put('/:id', /* protect, */ blogController.updateBlog)
router.delete('/:id', /* protect, */ blogController.deleteBlog)

module.exports = router
