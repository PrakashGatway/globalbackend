const mongoose = require('mongoose')

const notificationRecipientSchema = new mongoose.Schema(
{
  notification: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notification',
    required: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: {
    type: Date,
    default: null
  }
})

notificationRecipientSchema.index(
  { notification: 1, user: 1 },
  { unique: true }
)

module.exports = mongoose.model(
  'NotificationRecipient',
  notificationRecipientSchema
)
