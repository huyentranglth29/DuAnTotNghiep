const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["2D", "3D", "IMAX", "VIP"],
      default: "2D",
    },
    totalSeats: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ["active", "maintenance", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
    collection: "phòng",
  }
);

module.exports = mongoose.model("Room", roomSchema);
