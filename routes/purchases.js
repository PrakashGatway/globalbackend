// routes/checkoutRoutes.js
const express = require('express');
const router = express.Router({ mergeParams: true });
const checkoutController = require('../controllers/purchaseController');
const { protect } = require('../middleware/auth');


router.use(protect)
// Checkout routes
router.get('/:applicationId', checkoutController.getCheckoutDetails);
router.post('/:applicationId/apply-coupon', checkoutController.applyCoupon);
router.post('/:applicationId/payment', checkoutController.processPayment);

// Payment history routes
router.get('/payments/history', checkoutController.getPaymentHistory);
router.get('/payments/:purchaseId', checkoutController.getPaymentDetails);

module.exports = router;