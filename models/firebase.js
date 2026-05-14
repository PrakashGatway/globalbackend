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

// Add the TTL index to the automatically generated createdAt field
// TokenSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7*24*60*60 });

module.exports = mongoose.model("FirebaseToken", TokenSchema);
