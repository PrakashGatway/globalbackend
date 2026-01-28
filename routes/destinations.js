const express = require('express')
const router = express.Router()
const {
  getDestinations,
  getDestinationByType,
  updateDestination,
} = require('../controllers/destinationController')
const { protect } = require('../middleware/auth')

router.get('/', getDestinations)
router.get('/:type', getDestinationByType)
router.put('/:id', protect, updateDestination)

module.exports = router
