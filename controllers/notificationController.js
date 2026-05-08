const mongoose = require("mongoose");
const { Notification, NotificationRecipient } = require("../models/Notification");
const User = require("../models/User"); // adjust path

exports.getNotifications = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 15; // Default to 15 for frontend
        const skip = (page - 1) * limit;

        const [notifications, total] = await Promise.all([
            Notification.find()
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Notification.countDocuments()
        ]);

        res.json({
            success: true,
            data: {
                notifications: notifications,
                pagination: {
                    total,
                    page,
                    limit,
                    pages: Math.ceil(total / limit),
                }
            }
        });

    } catch (error) {
        console.error("Get notifications error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch notifications"
        });
    }
};

exports.sendToUser = async (req, res) => {
    try {
        const {
            userId,
            title,
            message,
            type,
            entityId,
            entityType,
            redirectUrl,
            coverImage,
            metadata,
            expiresAt,
            channels = { inApp: true, email: false, push: false },
            priority = 'medium',
            _id
        } = req.body;

        // Validation
        if (!userId || !title || !message || !type) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: userId, title, message, type"
            });
        }

        // Validate userId format
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid userId format"
            });
        }

        // Validate type enum
        const validTypes = [
            'application_update', 'document_request', 'document_verified',
            'document_rejected', 'university_update', 'offer_received',
            'offer_accepted', 'offer_rejected', 'payment_update',
            'appointment_reminder', 'deadline_reminder', 'chat_message',
            'system', 'admin', 'missing_requirement', 'note', 'application_status'
        ];
        if (!validTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                message: `Invalid notification type. Must be one of: ${validTypes.join(', ')}`
            });
        }

        const userExists = await User.findById(userId).select("_id");
        if (!userExists) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        let notification;
        // Create notification

        if (mongoose.Types.ObjectId.isValid(_id)) {
            notification = await Notification.findById(_id);
            notification.title = title.trim();
            notification.message = message.trim();
            notification.type = type;
            notification.entityId = entityId || null;
            notification.entityType = entityType || null;
            notification.redirectUrl = redirectUrl || null;
            notification.coverImage = coverImage || null;
            notification.channels = channels;
            notification.priority = priority;
            notification.metadata = metadata || {};
            await notification.save();
        } else {
            notification = await Notification.create({
                isGlobal: false,
                sender: req.user?._id || null,
                title: title.trim(),
                message: message.trim(),
                type,
                entityId: entityId || null,
                entityType: entityType || null,
                redirectUrl: redirectUrl || null,
                coverImage: coverImage || null,
                channels,
                priority,
                metadata: metadata || {}
            });
        }
        const recipientRecord = await NotificationRecipient.create({
            notification: notification._id,
            user: userId,
            expiresAt: expiresAt ? new Date(expiresAt) : null
        });

        // TODO: Trigger email/push notifications based on channels
        // if (channels.email) await sendEmailNotification(userId, notification);
        // if (channels.push) await sendPushNotification(userId, notification);

        res.status(201).json({
            success: true,
            message: "Notification sent successfully",
            data: {
                notification: notification.toObject(),
                recipient: recipientRecord.toObject()
            }
        });

    } catch (error) {
        console.error("sendToUser error:", error);

        // Handle duplicate key error (if unique index exists)
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Notification already exists for this user"
            });
        }

        res.status(500).json({
            success: false,
            message: error.message || "Failed to send notification"
        });
    }
};

exports.sendGlobal = async (req, res) => {
    try {
        const {
            title,
            message,
            type,
            redirectUrl,
            coverImage,
            metadata,
            expiresAt,
            channels = { inApp: true, email: false, push: false },
            priority = 'medium',
            targetFilters, // Optional: { roles: ['student'], statuses: ['active'] }
            _id
        } = req.body;

        // Validation
        if (!title || !message || !type) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: title, message, type"
            });
        }

        // Validate type enum
        const validTypes = [
            'application_update', 'document_request', 'document_verified',
            'document_rejected', 'university_update', 'offer_received',
            'offer_accepted', 'offer_rejected', 'payment_update',
            'appointment_reminder', 'deadline_reminder', 'chat_message',
            'system', 'admin', 'missing_requirement', 'note', 'application_status'
        ];
        if (!validTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                message: `Invalid notification type. Must be one of: ${validTypes.join(', ')}`
            });
        }

        let notification;

        if (mongoose.Types.ObjectId.isValid(_id)) {
            notification = await Notification.findById(_id);
            notification.title = title.trim();
            notification.message = message.trim();
            notification.type = type;
            notification.redirectUrl = redirectUrl || null;
            notification.coverImage = coverImage || null;
            notification.channels = channels;
            notification.priority = priority;
            notification.metadata = metadata || {};
            await notification.save();
        } else {
            notification = await Notification.create({
                isGlobal: true,
                sender: req.user?._id || null,
                title: title.trim(),
                message: message.trim(),
                type,
                redirectUrl: redirectUrl || null,
                coverImage: coverImage || null,
                channels,
                priority,
                metadata: metadata || {}
            });
        }

        // Build user query for targeted global notifications
        const userQuery = {};
        if (targetFilters?.roles?.length) {
            userQuery.role = { $in: targetFilters.roles };
        }
        if (targetFilters?.statuses?.length) {
            userQuery.status = { $in: targetFilters.statuses };
        }

        // Fetch target users (with pagination to avoid memory issues)
        const BATCH_SIZE = 1000;
        let skip = 0;
        let totalRecipients = 0;
        const errors = [];

        while (true) {
            const users = await User.find(userQuery)
                .select("_id")
                .skip(skip)
                .limit(BATCH_SIZE)
                .lean();

            if (users.length === 0) break;

            const recipients = users.map(user => ({
                notification: notification._id,
                user: user._id,
                expiresAt: expiresAt ? new Date(expiresAt) : null
            }));

            try {
                await NotificationRecipient.insertMany(recipients, { ordered: false });
                totalRecipients += recipients.length;
            } catch (batchError) {
                console.error("Batch insert error:", batchError);
                errors.push(...(batchError.writeErrors?.map(e => e.err) || []));
            }

            skip += BATCH_SIZE;
        }

        res.status(201).json({
            success: true,
            message: `Global notification sent to ${totalRecipients} users`,
            data: {
                notification: notification.toObject(),
                stats: {
                    totalRecipients,
                    failedInserts: errors.length
                }
            }
        });

    } catch (error) {
        console.error("sendGlobal error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to send global notification"
        });
    }
};

exports.sendToMultipleUsers = async (req, res) => {
    try {
        const {
            userIds, // Array of userIds
            title,
            message,
            type,
            entityId,
            entityType,
            redirectUrl,
            coverImage,
            metadata,
            expiresAt,
            channels = { inApp: true, email: false, push: false },
            priority = 'medium',
            _id
        } = req.body;

        // Validation
        if (!Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: "userIds must be a non-empty array"
            });
        }
        if (!title || !message || !type) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: title, message, type"
            });
        }

        // Validate all userIds
        const invalidIds = userIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
        if (invalidIds.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Invalid userIds: ${invalidIds.join(', ')}`
            });
        }

        let notification;

        if (mongoose.Types.ObjectId.isValid(_id)) {
            notification = await Notification.findById(_id);
            notification.title = title.trim();
            notification.message = message.trim();
            notification.type = type;
            notification.entityId = entityId || null;
            notification.entityType = entityType || null;
            notification.redirectUrl = redirectUrl || null;
            notification.coverImage = coverImage || null;
            notification.channels = channels;
            notification.priority = priority;
            notification.metadata = metadata || {};
            await notification.save();
        } else {
            notification = await Notification.create({
                isGlobal: false,
                sender: req.user?._id || null,
                title: title.trim(),
                message: message.trim(),
                type,
                entityId: entityId || null,
                entityType: entityType || null,
                redirectUrl: redirectUrl || null,
                coverImage: coverImage || null,
                channels,
                priority,
                metadata: metadata || {}
            });
        }

        // Verify users exist and create recipient records
        const existingUsers = await User.find({ _id: { $in: userIds } }).select("_id");
        const existingUserIds = new Set(existingUsers.map(u => u._id.toString()));

        const recipients = existingUsers.map(user => ({
            notification: notification._id,
            user: user._id,
            expiresAt: expiresAt ? new Date(expiresAt) : null
        }));

        await NotificationRecipient.insertMany(recipients, { ordered: false });

        const failedCount = userIds.length - existingUsers.length;

        res.status(201).json({
            success: true,
            message: `Notification sent to ${existingUsers.length} users`,
            data: {
                notification: notification.toObject(),
                stats: {
                    requested: userIds.length,
                    successful: existingUsers.length,
                    failed: failedCount
                }
            }
        });

    } catch (error) {
        console.error("sendToMultipleUsers error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to send bulk notification"
        });
    }
};

// controllers/notificationController.js
exports.getUserNotifications = async (req, res) => {
    try {
        const userId = req.user._id;

        console.log(userId)
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 15; // Default to 15 for frontend
        const skip = (page - 1) * limit;
        const unreadOnly = req.query.unread === 'true';

        const query = { user: userId };
        if (unreadOnly) query.isRead = false;

        const [notifications, total] = await Promise.all([
            NotificationRecipient.find(query)
                .populate({
                    path: "notification",
                    select: "title message type entityId entityType redirectUrl coverImage metadata priority createdAt"
                })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            NotificationRecipient.countDocuments(query)
        ]);

        // Flatten structure for frontend
        const formattedNotifications = notifications.map(recipient => {
            const notif = recipient.notification;
            if (notif === null) return [];
            return {
                id: notif?._id.toString(),
                recipientId: recipient._id.toString(),
                title: notif.title,
                message: notif.message,
                type: notif.type,
                priority: notif.priority || 'medium',
                entityId: notif.entityId,
                entityType: notif.entityType,
                redirectUrl: notif.redirectUrl,
                coverImage: notif.coverImage,
                metadata: notif.metadata,
                timestamp: notif.createdAt,
                read: recipient.isRead,
                readAt: recipient.readAt,
                expiresAt: recipient.expiresAt,
                applicationName: notif.metadata?.applicationName || null
            };
        });



        res.json({
            success: true,
            data: {
                notifications: formattedNotifications.flat(),
                pagination: {
                    total,
                    page,
                    limit,
                    pages: Math.ceil(total / limit),
                    hasNext: page * limit < total,
                    hasPrev: page > 1
                }
            }
        });

    } catch (error) {
        console.error("Get notifications error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch notifications"
        });
    }
};


exports.markAsRead = async (req, res) => {
    try {

        const userId = req.user._id;
        const { notificationId } = req.params;

        const record = await NotificationRecipient.findOneAndUpdate(
            {
                user: userId,
                notification: notificationId
            },
            {
                isRead: true,
                readAt: new Date()
            },
            { new: true }
        );

        res.json({
            success: true,
            message: "Marked as read",
            record
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.markAllAsRead = async (req, res) => {
    try {

        const userId = req.user._id;

        await NotificationRecipient.updateMany(
            {
                user: userId,
                isRead: false
            },
            {
                isRead: true,
                readAt: new Date()
            }
        );

        res.json({
            success: true,
            message: "All marked as read"
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteNotification = async (req, res) => {
    try {

        const userId = req.user._id;
        const { notificationId } = req.params;

        await NotificationRecipient.deleteOne({
            user: userId,
            notification: notificationId
        });

        res.json({
            success: true,
            message: "Notification deleted"
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


exports.getUnreadCount = async (req, res) => {
    try {

        const userId = req.user._id;

        const count = await NotificationRecipient.countDocuments({
            user: userId,
            isRead: false
        });

        res.json({
            success: true,
            count
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteNotify = async (req, res) => {
    try {

        const { notificationId } = req.params;

        await Notification.findByIdAndDelete(notificationId);
        await NotificationRecipient.deleteMany({ notification: notificationId });

        res.json({
            success: true,
            message: "Notification deleted"
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
