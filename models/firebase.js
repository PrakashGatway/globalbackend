const mongoose = require("mongoose");

const TokenSchema = new mongoose.Schema(
  {
    name: {
        type: String,
        default: "counsellor"
    },
    userId : String, 
    fcmToken: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
); 

module.exports = mongoose.model("FirebaseToken", TokenSchema);