const express = require("express");
const router = express.Router();

const controller = require("../controllers/notificationController");
const { protect, authorize } = require("../middleware/auth");


router.post("/send/user",protect, authorize('admin', 'manager'), controller.sendToUser);
router.post("/send/global",protect,authorize('admin', 'manager'),  controller.sendGlobal);
router.post("/send/bluk",protect,authorize('admin', 'manager'),  controller.sendToMultipleUsers);

router.get("/", protect, controller.getUserNotifications);
router.get("/admin", protect, controller.getNotifications);
router.delete("/admin/:notificationId", protect, authorize('admin', 'manager'), controller.deleteNotify);

router.patch("/read/:notificationId", protect, controller.markAsRead);
router.patch("/read-all", protect, controller.markAllAsRead);
router.delete("/:notificationId", protect, controller.deleteNotification);
router.get("/unread/count", protect, controller.getUnreadCount);


module.exports = router;
