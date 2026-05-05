const express = require('express');
const router = express.Router();

const couponController = require('../controllers/couponController');
const { protect, authorize } = require('../middleware/auth');


// ADMIN
router.post('/', protect, authorize('admin','counsellor'), couponController.createCoupon); 
router.get('/', protect, authorize('admin','counsellor'), couponController.getCoupons);
// router.get('/analytics', protect, authorize('admin'), couponController.getCouponAnalytics);
router.get('/:id', protect, authorize('admin'), couponController.getCouponById);

router.get('/assign/:id',
    protect,
    authorize('admin','counsellor'),
    couponController.getAssignCoupon);

router.put('/:id', protect, authorize('admin','counsellor'), couponController.updateCoupon);
router.delete('/:id', protect, authorize('admin','counsellor'), couponController.deleteCoupon);
 
router.get('/available/list', protect, couponController.getAvailableCoupons); //use
router.post('/apply', protect, couponController.applyCoupon);

router.patch("/scratch/create", protect, couponController.createScratchCard);
router.get("/scratch/my", protect, couponController.getMyScratchCards);
router.post("/scratch/use/:scratchCardId", protect, couponController.scratchCard);


module.exports = router;