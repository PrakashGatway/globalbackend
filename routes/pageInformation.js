const express = require('express')
const router = express.Router()

const {
  createPage,
  getAllPages,
  getPageById,
  getPageBySlug,
  updatePage,
  deletePage,
  getNavTabs,
} = require('../controllers/pageInfo')
const { protect, authorize } = require('../middleware/auth')

router.post('/', protect, authorize('admin', 'manager'), protect, createPage)
router.get('/', getAllPages)
router.get('/navbar', getNavTabs)
router.get('/:id', protect, authorize('admin', 'manager'), getPageById)
router.put('/:id', protect, authorize('admin', 'manager'), updatePage)
router.delete('/:id', protect, authorize('admin', 'manager'), deletePage)
router.get('/slug/:slug', getPageBySlug)

module.exports = router
