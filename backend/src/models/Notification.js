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
    type: {
      type: String,
      enum: ["chung", "voucher", "phim", "dat_ve", "thanh_toan"],
      default: "chung",
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    entityId: mongoose.Schema.Types.ObjectId,
    action: String,
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema, "thông báo");
