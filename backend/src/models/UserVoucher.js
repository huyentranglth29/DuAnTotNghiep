const mongoose = require("mongoose");

const userVoucherSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    voucher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Voucher",
      required: true,
    },
    status: {
      type: String,
      enum: ["available", "used", "expired"],
      default: "available",
    },
    usedAt: {
      type: Date,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
    },
  },
  {
    timestamps: true,
  }
);

userVoucherSchema.index({ user: 1, voucher: 1 }, { unique: true });

module.exports = mongoose.model("UserVoucher", userVoucherSchema);
