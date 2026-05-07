const admin = require("./config/firebaseAdmin");

const sendNotification = async () => {
  try {
    const response = await admin.messaging().send({
      token: "d2IWmcbInNTAkh8WHblAkE:APA91bGKD5bnoW5WN7PTSF9eyVe843vEZk4F4zcvsLkL1RwlhQCFBXq47b7UdcpmmU6YBctEiGzkI_0m6HTYjhtvjCguBIrvFbnnWobv3BzJF8KG_zoCJ2s",

      notification: {
        title: "New Message",
        body: "Hello from Node.js 🚀",
      },

      data: {
        type: "chat",
      },
    });

    console.log("Notification sent:", response);
  } catch (error) {
    console.log(error);
  }
};

sendNotification();