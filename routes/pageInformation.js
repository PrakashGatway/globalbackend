const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const ctrl = require('../controllers/pageInformationController')
const {
  getPageInformations,
  getPageInformation,
  getPageInformationBySlug,
  getPageInformationByType,
  createPageInformation,
  updatePageInformation,
  deletePageInformation,
  getImageBySlug,
} = require('../controllers/pageInformationController')

// Public route to get page by slug
router.get('/public/:slug', getPageInformationBySlug)

// Public route to get page by type
router.get('/public/type/:type', getPageInformationByType)

// Public route to get image by slug and image type
router.get('/images/:slug/:imageType', getImageBySlug)

// Protected routes for admin
router.get('/', protect, getPageInformations)
router.get('/:id', protect, getPageInformation)
router.post('/', protect, createPageInformation)
router.put('/:id', protect, updatePageInformation)
router.post('/:id/section', ctrl.addSection)
router.delete('/:pageId/section/:index', ctrl.deleteSection)

router.delete('/:id', protect, deletePageInformation)

module.exports = router
