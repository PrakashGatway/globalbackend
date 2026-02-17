const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const upload = require('../middleware/upload')
const { uploadImage, deleteImage, profileImage } = require('../controllers/uploadController')


router.post('/image', protect, upload.single('image'), uploadImage)
router.delete('/image/:publicId', protect, deleteImage)
router.put('/profile', protect, upload.single('image'), profileImage)

module.exports = router
