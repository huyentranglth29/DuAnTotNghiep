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
    combos: [{
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      name: String,
      image: String,
      quantity: { type: Number, min: 1 },
      unitPrice: { type: Number, min: 0 },
      totalPrice: { type: Number, min: 0 },
    }],
    ticketTotal: { type: Number, min: 0, default: 0 },
    comboTotal: { type: Number, min: 0, default: 0 },
    comboPickupCode: String,
    comboStatus: {
      type: String,
      enum: ["khong_co", "cho_nhan", "da_nhan"],
      default: "khong_co",
    },
    paymentMethod: String,
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
