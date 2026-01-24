const express = require('express')
const router = express.Router()
const { protect, admin } = require('../middleware/auth')
const {
  getApplications,
  getApplication,
  createApplication,
  updateApplication,
  deleteApplication,
  downloadAllApplications,
} = require('../controllers/applicationController')

// Routes
router.get('/', protect, getApplications)
router.get('/download/all', protect, downloadAllApplications)
router.get('/:id', protect, getApplication)
router.post('/', protect, createApplication)
router.put('/:id', protect, updateApplication)
router.delete('/:id', protect, admin, deleteApplication)

module.exports = router
