const mongoose = require("mongoose");

const quickBookingSchema = new mongoose.Schema(
  {
    showtimeId: {
      type: String,
      trim: true,
    },
    movieTitle: {
      type: String,
      required: true,
      trim: true,
    },
    movieDuration: {
      type: String,
    },
    movieGenre: {
      type: String,
    },
    seats: {
      type: [String],
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    cinema: {
      type: String,
      default: "FilmGo Hà Trung (Thanh Hóa)",
    },
    bookingDate: {
      type: String,
    },
    bookingTime: {
      type: String,
    },
    code: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "cancelled"],
      default: "paid",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("QuickBooking", quickBookingSchema, "đặt vé nhanh");
