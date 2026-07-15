const mongoose = require("mongoose");

const seatSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    row: {
      type: String,
      required: true,
      trim: true,
    },
    number: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ["normal", "vip", "couple"],
      default: "normal",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
    collection: "chỗ ngồi",
  }
);

seatSchema.index({ room: 1, row: 1, number: 1 }, { unique: true });

module.exports = mongoose.model("Seat", seatSchema);
