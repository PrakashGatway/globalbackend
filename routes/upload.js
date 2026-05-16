const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const upload = require('../middleware/upload')
const { uploadImage, deleteImage, profileImage, resumeUpload, uploadDocument } = require('../controllers/uploadController')
const uploadResume = require('../middleware/fileUpload')


router.post('/image', protect, upload.single('image'), uploadImage)
router.delete('/image/:publicId', protect, deleteImage)
router.put('/profile', protect, upload.single('image'), profileImage)
router.post("/resume", uploadResume.single("resume"),resumeUpload);


router.post("/",
    protect,
    upload.single("file"),
    uploadDocument,
  );


module.exports = router
