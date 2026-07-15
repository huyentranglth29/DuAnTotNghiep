const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    title: String,

    content: String,

    target: {
      type: String,
      enum: ["all", "vip", "newUser"],
      default: "all",
    },

    image: String,

    sentAt: Date,
  },
  { timestamps: true, collection: "thông báo" }
);

module.exports = mongoose.model("Notification", notificationSchema);
