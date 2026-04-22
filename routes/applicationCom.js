const express = require('express');
const router = express.Router();
const {
  getActivities,
  sendMessage,
  getMessages,
  markMessagesAsRead,
  getUnreadCount
} = require('../controllers/communication');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/applications/:id/activities', getActivities);
router.get('/applications/:id/messages', getMessages);
router.post('/applications/:id/messages', sendMessage);
router.put('/applications/:id/messages/read', markMessagesAsRead);
router.get('/applications/:id/messages/unread', getUnreadCount);

module.exports = router;