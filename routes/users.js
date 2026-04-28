// routes/userRoutes.js
const express = require('express')
const router = express.Router()

const {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  userStats,
  monthlyRegistrations,
  AssingUsers
} = require('../controllers/userController')
const { authorize, protect } = require('../middleware/auth')

router.post('/', protect, authorize('admin', 'manager','counsellor'), createUser)
router.get('/',protect, authorize('admin'),  getUsers)
router.get('/:id',protect, authorize('admin', 'manager'), getUserById)
router.get('/code/:code',protect, authorize('admin', 'counsellor'), AssingUsers)
router.put('/:id',protect, authorize('admin', 'manager'), updateUser)
router.delete('/:id',protect, authorize('admin', 'manager'),  deleteUser)

router.get('/analytics/stats',protect, authorize('admin', 'manager'),  userStats)
router.get('/analytics/monthly',protect, authorize('admin', 'manager'),  monthlyRegistrations)

module.exports = router
