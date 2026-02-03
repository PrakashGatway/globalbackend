const express = require('express')
const router = express.Router()

const {
  createPage,
  getAllPages,
  getPageById,
  getPageBySlug,
  updatePage,
  deletePage,
} = require('../controllers/pageInfo')
const { protect, admin } = require('../middleware/auth')

router.post('/', protect, createPage)
router.get('/', getAllPages)
router.get('/:id', getPageById)
router.put('/:id', protect, updatePage)
router.delete('/:id', protect, admin, deletePage)
router.get('/slug/:slug', getPageBySlug)

module.exports = router
