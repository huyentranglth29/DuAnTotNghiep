const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    orderCode: { type: String, required: true, unique: true, trim: true },
    provider: { type: String, enum: ["vnpay", "mo_phong"], default: "vnpay" },
    status: {
      type: String,
      enum: [
        "cho_thanh_toan",
        "da_thanh_toan",
        "that_bai",
        "het_han",
        "da_huy",
        "da_hoan_tien",
      ],
      default: "cho_thanh_toan",
    },
    amount: { type: Number, required: true, min: 0 },
    expiresAt: { type: Date, required: true },
    paidAt: Date,
    transactionNo: String,
    bankCode: String,
    responseCode: String,
    inventoryStatus: {
      type: String,
      enum: ["none", "reserved", "committed", "released"],
      default: "none",
    },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "QuickBooking" },
    voucher: { type: mongoose.Schema.Types.ObjectId, ref: "Voucher" },
    userVoucher: { type: mongoose.Schema.Types.ObjectId, ref: "UserVoucher" },
    subtotal: { type: Number, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    voucherCode: String,
    bookingData: {
      showtimeId: { type: String, required: true },
      movieTitle: { type: String, required: true },
      movieDuration: String,
      movieGenre: String,
      seats: { type: [String], required: true },
      combos: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        name: { type: String, required: true },
        image: String,
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true, min: 0 },
        totalPrice: { type: Number, required: true, min: 0 },
      }],
      ticketTotal: { type: Number, required: true, min: 0 },
      comboTotal: { type: Number, default: 0, min: 0 },
      totalPrice: { type: Number, required: true },
      cinema: String,
      bookingDate: String,
      bookingTime: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema, "thanh toán");
