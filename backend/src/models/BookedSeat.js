const mongoose = require("mongoose");

const bookedSeatSchema = new mongoose.Schema(
  {
    showtimeId: {
      type: String,
      required: true,
      trim: true,
    },
    seatLabel: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QuickBooking",
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
    },
    expiresAt: Date,
  },
  { timestamps: true }
);

bookedSeatSchema.index({ showtimeId: 1, seatLabel: 1 }, { unique: true });
bookedSeatSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("BookedSeat", bookedSeatSchema, "ghế đã đặt");
