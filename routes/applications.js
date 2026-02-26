const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const { protect } = require('../middleware/auth');

router.post('/',protect, applicationController.createApplication);
router.get('/',protect, applicationController.getApplications);
router.get('/:id',protect, applicationController.getApplication);
router.put('/:id',protect, applicationController.updateApplication);
router.delete('/:id',protect, applicationController.deleteApplication);

module.exports = router;