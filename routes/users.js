// routes/userRoutes.js
const express = require('express')
const router = express.Router()
const { saveToken,getToken } = require("../controllers/saveToken");
const {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  userStats,
  monthlyRegistrations
} = require('../controllers/userController')
const { authorize, protect } = require('../middleware/auth')



router.post("/save-token", saveToken);
router.get("/getToken", getToken);


router.post('/', protect, authorize('admin', 'manager','counsellor'), createUser)
router.get('/',protect, authorize('admin',"counsellor"),  getUsers)
router.get('/:id',protect, authorize('admin', 'manager','counsellor'), getUserById)
router.put('/:id',protect, authorize('admin', 'manager'), updateUser)
router.delete('/:id',protect, authorize('admin', 'manager'),  deleteUser)
router.get('/analytics/stats',protect, authorize('admin', 'manager'),  userStats)
router.get('/analytics/monthly',protect, authorize('admin', 'manager'),  monthlyRegistrations)


module.exports = router
