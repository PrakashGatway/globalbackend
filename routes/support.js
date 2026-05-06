const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const {
  getTickets,
  getTicket,
  createTicket,
  updateTicket,
  deleteTicket,
  replyToTicket,
  getuser
} = require('../controllers/supportController')

// Routes
router.get('/', protect, getTickets)
router.get('/:id', protect, getTicket)
router.get('/user/:id', protect, getuser)
router.post('/', protect, createTicket)
router.put('/:id', protect, updateTicket)
router.delete('/:id', protect, deleteTicket)
router.put('/reply/:id', protect, replyToTicket)

module.exports = router
