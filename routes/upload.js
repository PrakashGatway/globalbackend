const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const upload = require('../middleware/upload')
const { uploadImage, deleteImage, profileImage, resumeUpload, uploadDocument, ProfileDocs, deleteProfileDoc } = require('../controllers/uploadController')
const uploadResume = require('../middleware/fileUpload')
const DocumentUpload = require('../middleware/DocumentUpload')


router.post('/image', protect, upload.single('image'), uploadImage)
router.delete('/image/:publicId', protect, deleteImage)
router.put('/profile', protect, upload.single('image'), profileImage)
router.post("/resume", uploadResume.single("resume"), resumeUpload);

router.post("/documents", protect, DocumentUpload.single("file"), ProfileDocs);

router.delete("/documents", protect, deleteProfileDoc);

router.post("/",
  // protect,
  DocumentUpload.single("file"),
  uploadDocument,
);

module.exports = router
