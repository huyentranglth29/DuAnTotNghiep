/**
 * Seed voucher mẫu + user test (KHÔNG tạo booking giả → admin chưa dùng = 0).
 * Usage: npm run seed:vouchers
 */
require("dotenv").config();
const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const User = require("../models/User");
const Voucher = require("../models/Voucher");

const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  "mongodb://127.0.0.1:27017/filmgo";

const sampleVouchers = [
  {
    code: "SUMMER50",
    description: "Giảm 50% — đơn từ 200K",
    discountType: "percent",
    discountValue: 50,
    minOrderValue: 200000,
    maxDiscount: 80000,
    quantity: 500,
    startDate: new Date("2026-05-01"),
    endDate: new Date("2026-12-31"),
    status: "active",
  },
  {
    code: "FREEPCRN",
    description: "Giảm 45K combo bắp",
    discountType: "amount",
    discountValue: 45000,
    minOrderValue: 100000,
    quantity: 200,
    startDate: new Date("2026-05-01"),
    endDate: new Date("2026-12-31"),
    status: "active",
  },
  {
    code: "COMBO20K",
    description: "Giảm 20K cho combo",
    discountType: "amount",
    discountValue: 20000,
    minOrderValue: 80000,
    quantity: 300,
    startDate: new Date("2026-05-01"),
    endDate: new Date("2026-11-30"),
    status: "active",
  },
  {
    code: "FILMGO10",
    description: "Giảm 10% cho đơn từ 100K",
    discountType: "percent",
    discountValue: 10,
    minOrderValue: 100000,
    maxDiscount: 30000,
    quantity: 400,
    startDate: new Date("2026-05-01"),
    endDate: new Date("2026-12-31"),
    status: "active",
  },
];

async function upsertVouchers() {
  const docs = [];
  for (const item of sampleVouchers) {
    const doc = await Voucher.findOneAndUpdate(
      { code: item.code },
      { $set: item },
      { upsert: true, returnDocument: "after", runValidators: true }
    );
    docs.push(doc);
  }
  return docs;
}

async function ensureDemoUser() {
  let demo = await User.findOne({ email: "user@filmgo.com" });
  if (!demo) {
    demo = await User.create({
      email: "user@filmgo.com",
      fullName: "FilmGo User",
      password: "User@123456",
      role: "user",
      status: "active",
      phone: "0901000000",
    });
  }
  return demo;
}

const run = async () => {
  await mongoose.connect(MONGO_URI);

  const vouchers = await upsertVouchers();
  await ensureDemoUser();

  // Xóa booking seed giả trước đây (làm admin hiện "đã dùng" ảo)
  const deleted = await Booking.deleteMany({
    paymentMethod: "momo",
    totalPrice: { $in: [99001, 99002, 99003, 99004] },
  });

  console.log(`OK: ${vouchers.length} vouchers (SUMMER50, FREEPCRN, ...)`);
  console.log(`Đã xóa ${deleted.deletedCount} booking seed giả.`);
  console.log("User test: user@filmgo.com / User@123456");
  console.log(
    "Admin 'đã dùng' = 0 cho đến khi khách thanh toán thật kèm voucher."
  );
  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.disconnect();
  } catch (_) {
    /* ignore */
  }
  process.exit(1);
});
