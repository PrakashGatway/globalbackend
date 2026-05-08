const admin = require("../config/firebaseAdmin");
const User = require("../models/firebase");
const Notificaion = require("../models/Notification");

const sendNotification = async ({
  userId,
  title,
  body,
  data = {},
}) => {
  try {

    // FIND USER
    const user = await User.findOne({userId: userId});

    if (!user) {
      console.log("User not found");
      return;
    }

    // CHECK TOKEN
    if (!user.fcmToken) {
      console.log("FCM token missing");
      return;
    }

    // MESSAGE OBJECT
    const message = {
      token: user.fcmToken,

      notification: {
        title,
        body,
      },

      data: {
        ...data,
      },

      android: {
        priority: "high",
      },

      apns: {
        payload: {
          aps: {
            sound: "default",
          },
        },
      },

      webpush: {
        notification: {
          icon: "/images/logo.png",
        },
      },
    };

    // SEND
    const response = await admin
      .messaging()
      .send(message);

    console.log(
      "Notification sent:",
      response
    );

    return response;

  } catch (error) {

    console.log(
      "Notification Error:",
      error.message
    );
  }
};

module.exports = sendNotification;






// const admin = require("./config/firebaseAdmin");

// const sendNotification = async () => {
//   try {
//     const response = await admin.messaging().send({
//       token: "d2IWmcbInNTAkh8WHblAkE:APA91bGKD5bnoW5WN7PTSF9eyVe843vEZk4F4zcvsLkL1RwlhQCFBXq47b7UdcpmmU6YBctEiGzkI_0m6HTYjhtvjCguBIrvFbnnWobv3BzJF8KG_zoCJ2s",

//       notification: {
//         title: "New Message",
//         body: "Hello from Node.js 🚀",
//       },

//       data: {
//         type: "chat",
//       },
//     });

//     console.log("Notification sent:", response);
//   } catch (error) {
//     console.log(error);
//   }
// };

// sendNotification();