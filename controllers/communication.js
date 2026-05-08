const Communication = require('../models/Communication');
const sendNotification = require('../middleware/notificaion');

// ============ HELPER FUNCTIONS ============
const logActivity = async (data) => {
  const activity = new Communication({
    ...data,
    type: 'activity'
  });
  await activity.save();
  return activity;
};

// ============ ACTIVITY CONTROLLERS ============
const getActivities = async (req, res) => {
  try {
    const activities = await Communication.find({ 
      application: req.params.id, 
      type: 'activity' 
    })
      .sort({ createdAt: -1 })
      .limit(parseInt(req.query.limit) || 50)
      .populate('user', 'name email');
    
    res.json({ success: true, data: activities });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============ MESSAGE CONTROLLERS ============
const sendMessage = async (req, res) => {
  try {
    const message = new Communication({
      application: req.params.id,
      type: 'message',
      content: req.body.content,
      user: req.user._id,
      userType: req.user.role === 'user' ? 'student' : 'ooshas',
      isRead: false
    });
    
    await message.save();
    
    // Populate user info before sending response
    await message.populate('user', 'name email');
    
    const receiverUserId =  req.user.assignto;
    console.log("sendMessage", req.user);
    
    await sendNotification({
      userId: receiverUserId,
      title: "New Message",
      body: req.body.content,
      data: {
        type: "chat",
        applicationId:
          req.params.id.toString(),
      },
    });


    res.json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const messages = await Communication.find({ 
      application: req.params.id, 
      type: 'message' 
    })
      .sort({ createdAt: 1 })
      .populate('user', 'name email');
    
    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const markMessagesAsRead = async (req, res) => {
  try {
    await Communication.updateMany(
      { 
        application: req.params.id, 
        type: 'message',
        userType: { $ne: req.user.role },
        isRead: false 
      },
      { isRead: true }
    );
    res.json({ success: true, message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const count = await Communication.countDocuments({
      application: req.params.id,
      type: 'message',
      userType: { $ne: req.user.role },
      isRead: false
    });
    res.json({ success: true, data: { unreadCount: count } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============ EXPORT ALL ============
module.exports = {
  // Helpers
  logActivity,
  getActivities,
  sendMessage,
  getMessages,
  markMessagesAsRead,
  getUnreadCount
};