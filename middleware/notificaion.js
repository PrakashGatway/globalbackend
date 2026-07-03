const admin = require("../config/firebaseAdmin");
const User = require("../models/firebase");

const {
  Notification,
  NotificationRecipient,
} = require("../models/Notification");


const sendNotification = async ({
  userId,
  sender = null,
  title,
  body,
  type = "system",
  entityId = null,
  entityType = null,
  redirectUrl = null,
  coverImage = null,
  priority = "medium",
  data = {},
}) => {
  try {
    // Find User
    const user = await User.findOne({ userId });

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // Save Notification
    const notification = await Notification.create({
      sender,
      title,
      message: body,
      type,
      entityId,
      entityType,
      redirectUrl,
      coverImage,
      priority,
      channels: {
        inApp: true,
        push: true,
      },
      metadata: {
        ...data,
      },
    });

    // Save Recipient
    await NotificationRecipient.create({
      notification: notification._id,
      user: user.userId,
      isRead: false,
    });

    console.log(`Notification saved for ${user.userId}`);

    // No FCM Token
    if (!user.fcmToken) {
      return {
        success: true,
        notification,
        pushSent: false,
        message: "Notification stored, FCM token missing.",
      };
    }

    // Firebase Payload
    const message = {
      token: user.fcmToken,

      notification: {
        title,
        body,
      },

      data: {
        notificationId: notification._id.toString(),
        type,
        ...Object.entries(data).reduce((acc, [key, value]) => {
          acc[key] = String(value);
          return acc;
        }, {}),
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
          icon: "/images/newlogo3.png",
        },
      },
    };

    const response = await admin.messaging().send(message);

    console.log("Push Notification Sent:", response);

    return {
      success: true,
      notification,
      pushSent: true,
      firebaseResponse: response,
    };
  } catch (error) {
    console.error("sendNotification Error:", error);

    return {
      success: false,
      error: error.message,
    };
  }
};


const LiveNotification = async ({
  userId,
  title,
  body,
  type = "system",
  data = {},
}) => {
  try {
    // Find User
    const user = await User.findOne({ userId });

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    if (!user.fcmToken) {
      return {
        success: false,
        error: "FCM token missing",
      };
    }

    const message = {
      token: user.fcmToken,

      notification: {
        title,
        body,
      },

      data: {
        type,
        ...Object.entries(data).reduce((acc, [key, value]) => {
          acc[key] = String(value);
          return acc;
        }, {}),
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
          icon: "/images/newlogo3.png",
        },
      },
    };

    const response = await admin.messaging().send(message);

    console.log("Live Notification Sent:", response);

    return {
      success: true,
      firebaseResponse: response,
    };
  } catch (error) {
    console.error("LiveNotification Error:", error);

    return {
      success: false,
      error: error.message,
    };
  }
};

module.exports = {
  sendNotification,
  LiveNotification,
};





// // old code 
// const admin = require("../config/firebaseAdmin");
// const User = require("../models/firebase");

// const {
//   Notification,
//   NotificationRecipient,
// } = require("../models/Notification");

// const sendNotification = async ({
//   userId,
//   sender = null,
//   title,
//   body,
//   type = "system",
//   entityId = null,
//   entityType = null,
//   redirectUrl = null,
//   coverImage = null,
//   priority = "medium",
//   data = {},
// }) => {
//   try {

//     // FIND USER
//     const user = await User.findOne({
//       userId: userId,
//     });

//     console.log("user data : ", userId,sender)

//     if (!user) {
//       console.log("User not found");
//       return;
//     }


//     // CREATE NOTIFICATION
//     const notification = 
//     await Notification.create({
//         sender,
//         title,
//         message: body,
//         type,
//         entityId,
//         entityType,
//         redirectUrl,
//         coverImage,
//         priority,
//         channels: {
//           inApp: true,
//           push: true,
//         },
//         metadata: {
//           ...data,
//         },
//       });

//     // CREATE RECIPIENT
//     await NotificationRecipient.create({
//       notification: notification._id,
//       user: userId,
//       isRead: false,
//     });

//     console.log(
//       "Notification stored in DB" + userId
//     );


//     if (!user.fcmToken) {

//       console.log(
//         "FCM token missing"
//       );

//       return notification;
//     }

//     // FIREBASE MESSAGE
//     const message = {
//       token: user.fcmToken,

//       notification: {
//         title,
//         body,
//       },

//       data: {
//         notificationId:
//           notification._id.toString(),

//         type,

//         ...Object.keys(data).reduce(
//           (acc, key) => {
//             acc[key] =
//               String(data[key]);

//             return acc;
//           },
//           {}
//         ),
//       },

//       android: {
//         priority: "high",
//       },

//       apns: {
//         payload: {
//           aps: {
//             sound: "default",
//           },
//         },
//       },

//       webpush: {
//         notification: {
//           icon: "/images/newlogo3.png",
//         },
//       },
//     };

//     // SEND PUSH
//     const response =  await admin.messaging().send(message);

//     console.log(
//       "Notification sent:",
//       response
//     );

//     return {
//       success: true,
//       notification,
//       firebaseResponse: response,
//     };

//   } catch (error) {

//     console.log(
//       "Notification Error:",
//       error.message
//     );

//     return {
//       success: false,
//       error: error.message,
//     };
//   }
// };

// module.exports = sendNotification;

