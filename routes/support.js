const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const {
  getTickets,
  getTicket,
  createTicket,
  updateTicket,
  deleteTicket,
} = require('../controllers/supportController')

// Routes
router.get('/', protect, getTickets)
router.get('/:id', protect, getTicket)
router.post('/', protect, createTicket)
router.put('/:id', protect, updateTicket)
router.delete('/:id', protect, deleteTicket)

module.exports = router
