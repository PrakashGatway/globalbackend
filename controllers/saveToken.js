const Token = require("../models/firebase");
const admin = require("../config/firebaseAdmin");



// SAVE USER FCM TOKEN
exports.saveToken = async (req, res) => {
  try {
    const { userId, token } = req.body;

    if (!userId || !token) {
      return res.status(400).json({
        success: false,
        message: "userId and token required",
      });
    }
    const user = await Token.findOneAndUpdate(
      { userId: userId }, 
      { fcmToken: token }, 
      { 
        new: true,      
        upsert: true,   // Create the document if it doesn't exist
        setDefaultsOnInsert: true 
      }
    );

    res.status(200).json({
      success: true,
      message: "Token saved successfully",
      data: user,
    });

  } catch (error) {
    console.error("Error saving token:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};




// GET ALL USERS TOKENS
exports.getToken = async (req, res) => {
  try {

    const data = await Token.find()
    // .select(
    //   "name email fcmToken"
    // );

    res.status(200).json({
      success: true,
      data,
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};




// SEND NOTIFICATION TO SPECIFIC USER
exports.sendNotification = async (req, res) => {
  try {

    const {
      userId,
      title,
      body,
    } = req.body;

    if (!userId || !title || !body) {
      return res.status(400).json({
        success: false,
        message: "All fields required",
      });
    }

    const user = await Token.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.fcmToken) {
      return res.status(400).json({
        success: false,
        message: "FCM token missing",
      });
    }

    const message = {
      token: user.fcmToken,

      notification: {
        title,
        body,
      },

      data: {
        type: "chat",
      },
    };

    const response = await admin
      .messaging()
      .send(message);

    res.status(200).json({
      success: true,
      message: "Notification sent",
      response,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};