const express = require('express')
const router = express.Router()

const {
  createContactUs,
  getAllContactUs,
  getContactUsById,
  updateContactUs,
  deleteContactUs,
  getContactUsStats,
} = require('../controllers/contactusController')

// Public
router.post('/', createContactUs)

// Admin
router.get('/', getAllContactUs)
router.get('/stats/dashboard', getContactUsStats)
router.get('/:id', getContactUsById)
router.put('/:id', updateContactUs)
router.delete('/:id', deleteContactUs)

module.exports = router
