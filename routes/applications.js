const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/DocumentUpload');

router.post('/', protect, applicationController.createApplication);
router.put(
    '/documents/:applicationId/:documentId',
    protect,
    upload.single('file'),
    applicationController.uploadAndUpdateDocument
);
router.get('/', protect, applicationController.getApplications);
router.get('/:id', protect, applicationController.getApplication);
router.put('/:id', protect, applicationController.updateApplication);
router.delete('/:id', protect, applicationController.deleteApplication);

module.exports = router;