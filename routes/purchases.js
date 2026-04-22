// routes/checkoutRoutes.js
const express = require('express');
const router = express.Router({ mergeParams: true });
const checkoutController = require('../controllers/purchaseController');
const { protect, authorize } = require('../middleware/auth');


router.use(protect)

router.route('/')
    .get(authorize('admin', 'manager'), checkoutController.getAllPayments);

router.route('/stats')
    .get(authorize('admin', 'manager'), checkoutController.getPaymentStats);

router.get('/:applicationId', checkoutController.getCheckoutDetails);
router.post('/:applicationId/apply-coupon', checkoutController.applyCoupon);
router.post('/:applicationId/payment', checkoutController.processPayment);

router.get('/payments/history', checkoutController.getPaymentHistory);
router.get('/payments/:purchaseId', checkoutController.getPaymentDetails);


module.exports = router;