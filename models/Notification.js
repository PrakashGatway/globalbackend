const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
            index: true
        },
        isGlobal: {
            type: Boolean,
            default: false,
            index: true
        },
        sender: {
            type:String,
            default: null
        },
        title: {
            type: String,
            required: true,
            trim: true
        },
        message: {
            type: String,
            required: true,
            trim: true
        },
        type: {
            type: String,
            enum: [
                'application_update',
                'document_request',
                'document_verified',
                'document_rejected',
                'university_update',
                'offer_received',
                'offer_accepted',
                'offer_rejected',
                'payment_update',
                'appointment_reminder',
                'deadline_reminder',
                'chat_message',
                'system',
                'admin'
            ],
            required: true,
            index: true
        },
        entityId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null
        },
        entityType: {
            type: String,
            enum: [
                'Application',
                'Document',
                'University',
                'Message',
                'Payment',
                'Appointment'
            ],
            default: null
        },
        redirectUrl: {
            type: String,
            default: null
        },
        coverImage: {
            type: String,
            default: null
        },
        channels: {
            inApp: { type: Boolean, default: true },
            email: { type: Boolean, default: false },
            push: { type: Boolean, default: false }
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'medium'
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        }

    },
    {
        timestamps: true
    }
)


// indexes for fast queries
notificationSchema.index({ recipient: 1, isRead: 1 })
notificationSchema.index({ recipient: 1, createdAt: -1 })

module.exports = mongoose.model('Notification', notificationSchema)
