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

    // FIND USER
    const user = await User.findOne({
      userId: userId,
    });

    console.log("user data : ", userId,sender)

    if (!user) {
      console.log("User not found");
      return;
    }


    // CREATE NOTIFICATION
    const notification = 
    await Notification.create({
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

    // CREATE RECIPIENT
    await NotificationRecipient.create({
      notification: notification._id,
      user: userId,
      isRead: false,
    });

    console.log(
      "Notification stored in DB" + userId
    );


    if (!user.fcmToken) {

      console.log(
        "FCM token missing"
      );

      return notification;
    }

    // FIREBASE MESSAGE
    const message = {
      token: user.fcmToken,

      notification: {
        title,
        body,
      },

      data: {
        notificationId:
          notification._id.toString(),

        type,

        ...Object.keys(data).reduce(
          (acc, key) => {
            acc[key] =
              String(data[key]);

            return acc;
          },
          {}
        ),
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

    // SEND PUSH
    const response =  await admin.messaging().send(message);

    console.log(
      "Notification sent:",
      response
    );

    return {
      success: true,
      notification,
      firebaseResponse: response,
    };

  } catch (error) {

    console.log(
      "Notification Error:",
      error.message
    );

    return {
      success: false,
      error: error.message,
    };
  }
};

module.exports = sendNotification;



// const admin = require("../config/firebaseAdmin");
// const User = require("../models/firebase");
// const Notificaion = require("../models/Notification");

// const sendNotification = async ({
//   userId,
//   title,
//   body,
//   data = {},
// }) => {
//   try {

//     const user = await User.findOne({userId: userId});

//     if (!user) {
//       console.log("User not found");
//       return;
//     }
    
//     if (!user.fcmToken) {
//       console.log("FCM token missing");
//       return;
//     }

//     // MESSAGE OBJECT
//     const message = {
//       token: user.fcmToken,

//       notification: {
//         title,
//         body,
//       },

//       data: {
//         ...data,
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
//           icon: "/images/logo.png",
//         },
//       },
//     };

//     // SEND
//     const response = await admin
//       .messaging()
//       .send(message);

//     console.log(
//       "Notification sent:",
//       response
//     );

//     return response;

//   } catch (error) {

//     console.log(
//       "Notification Error:",
//       error.message
//     );
//   }
// };

// module.exports = sendNotification;







// const admin = require("../config/firebaseAdmin");
// const User = require("../models/firebase");
// const Notificaion = require("../models/Notification");

// const sendNotification = async ({
//   userId,
//   title,
//   body,
//   data = {},
// }) => {
//   try {

//     const user = await User.findOne({userId: userId});

//     if (!user) {
//       console.log("User not found");
//       return;
//     }
    
//     if (!user.fcmToken) {
//       console.log("FCM token missing");
//       return;
//     }

//     // MESSAGE OBJECT
//     const message = {
//       token: user.fcmToken,

//       notification: {
//         title,
//         body,
//       },

//       data: {
//         ...data,
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
//           icon: "/images/logo.png",
//         },
//       },
//     };

//     // SEND
//     const response = await admin
//       .messaging()
//       .send(message);

//     console.log(
//       "Notification sent:",
//       response
//     );

//     return response;

//   } catch (error) {

//     console.log(
//       "Notification Error:",
//       error.message
//     );
//   }
// };

// module.exports = sendNotification;




