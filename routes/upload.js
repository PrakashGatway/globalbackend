const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const upload = require('../middleware/upload')
const { uploadImage, deleteImage } = require('../controllers/uploadController')

// Routes
router.post('/image', protect, upload.single('image'), uploadImage)
router.delete('/image/:publicId', protect, deleteImage)

module.exports = router
