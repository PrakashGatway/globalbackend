const admin = require("firebase-admin");
const path = require("path");

// Service account file path
const serviceAccount = require(path.join(
  __dirname,
  "../firebase-adminsdk.json"
));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

module.exports = admin;