const mongoose = require("mongoose");
const Payment = require("../models/Payment");
const BookedSeat = require("../models/BookedSeat");
const QuickBooking = require("../models/QuickBooking");
const Showtime = require("../models/Showtime");
const Seat = require("../models/Seat");
const Product = require("../models/Product");
const Voucher = require("../models/Voucher");
const UserVoucher = require("../models/UserVoucher");
const { buildQuery, sign, verify, formatVnpDate } = require("../utils/vnpay");
const { createNotification } = require("../services/notificationService");

const HOLD_MINUTES = 15;
const STATUS_LABELS = {
  cho_thanh_toan: "Đang chờ thanh toán",
  da_thanh_toan: "Thành công",
  that_bai: "Thất bại",
  het_han: "Hết thời gian",
  da_huy: "Người dùng hủy",
  da_hoan_tien: "Đã hoàn tiền",
};

const normalizeSeats = (seats) =>
  [...new Set((Array.isArray(seats) ? seats : []).map((seat) =>
    String(seat).trim().toUpperCase()
  ).filter(Boolean))];

const normalizeGenre = (genre) =>
  Array.isArray(genre) ? genre.filter(Boolean).join(", ") : String(genre || "").trim();

const notifyPendingPayment = payment => payment.user && createNotification({
  user: payment.user, type: "thanh_toan", entityId: payment._id,
  action: "mo_thanh_toan", title: "Đang chờ thanh toán",
  content: `Giao dịch ${payment.orderCode} cho phim ${payment.bookingData.movieTitle} đang chờ thanh toán.`,
});

const notifyBookingFailure = (user, movieTitle, reason) => user && createNotification({
  user, type: "dat_ve", action: "mo_dat_ve", title: "Đặt vé không thành công",
  content: `${movieTitle ? `Phim ${movieTitle}: ` : ""}${reason}`,
});

async function prepareVoucher(userId, rawCode, subtotal) {
  const code = String(rawCode || "").trim().toUpperCase();
  if (!code) return { voucher: null, userVoucher: null, discount: 0 };
  if (!userId) { const error = new Error("Vui lòng đăng nhập để sử dụng voucher"); error.status = 401; throw error; }
  const voucher = await Voucher.findOne({ code }).lean();
  if (!voucher) { const error = new Error("Voucher không tồn tại"); error.status = 404; throw error; }
  const now = new Date();
  if (voucher.status !== "active" || new Date(voucher.startDate) > now || new Date(voucher.endDate) < now) {
    const error = new Error("Voucher không còn hiệu lực"); error.status = 400; throw error;
  }
  const owned = await UserVoucher.findOne({ user: userId, voucher: voucher._id, status: "available" });
  if (!owned) { const error = new Error("Voucher chưa có trong kho hoặc đã được sử dụng"); error.status = 400; throw error; }
  if (subtotal < Number(voucher.minOrderValue || 0)) {
    const error = new Error(`Đơn hàng phải từ ${Number(voucher.minOrderValue).toLocaleString("vi-VN")}đ để dùng voucher`); error.status = 400; throw error;
  }
  let discount = voucher.discountType === "percent"
    ? Math.round(subtotal * Number(voucher.discountValue) / 100)
    : Number(voucher.discountValue);
  if (voucher.maxDiscount != null) discount = Math.min(discount, Number(voucher.maxDiscount));
  return { voucher, userVoucher: owned, discount: Math.min(subtotal, Math.max(0, discount)) };
}

async function reserveVoucher(payment) {
  if (!payment.userVoucher) return;
  const row = await UserVoucher.findOneAndUpdate(
    { _id: payment.userVoucher, status: "available" },
    { $set: { status: "reserved", reservedPayment: payment._id } },
    { returnDocument: "after" }
  );
  if (!row) { const error = new Error("Voucher vừa được sử dụng ở giao dịch khác"); error.status = 409; throw error; }
}

async function releaseVoucher(payment) {
  if (!payment.userVoucher) return;
  await UserVoucher.updateOne(
    { _id: payment.userVoucher, status: "reserved", reservedPayment: payment._id },
    { $set: { status: "available" }, $unset: { reservedPayment: 1 } }
  );
}

async function prepareCombos(rawCombos) {
  const quantities = new Map();
  for (const item of Array.isArray(rawCombos) ? rawCombos : []) {
    const productId = String(item?.productId || item?.product || "").trim();
    const quantity = Math.floor(Number(item?.quantity));
    if (!mongoose.Types.ObjectId.isValid(productId) || quantity < 1 || quantity > 10) {
      const error = new Error("Thông tin combo hoặc số lượng không hợp lệ");
      error.status = 400;
      throw error;
    }
    quantities.set(productId, (quantities.get(productId) || 0) + quantity);
  }
  if (!quantities.size) return { combos: [], comboTotal: 0 };

  const products = await Product.find({
    _id: { $in: [...quantities.keys()] },
    isActive: true,
  }).lean();
  if (products.length !== quantities.size) {
    const error = new Error("Có combo không tồn tại hoặc đã ngừng bán");
    error.status = 400;
    throw error;
  }
  const combos = products.map((product) => {
    const quantity = quantities.get(String(product._id));
    if (Number(product.stock) < quantity) {
      const error = new Error(`${product.name} chỉ còn ${product.stock} sản phẩm`);
      error.status = 409;
      throw error;
    }
    return {
      product: product._id,
      name: product.name,
      image: product.image,
      quantity,
      unitPrice: Number(product.price),
      totalPrice: Number(product.price) * quantity,
    };
  });
  return {
    combos,
    comboTotal: combos.reduce((sum, item) => sum + item.totalPrice, 0),
  };
}

async function reserveComboStock(payment) {
  const reserved = [];
  try {
    for (const item of payment.bookingData.combos || []) {
      const product = await Product.findOneAndUpdate(
        { _id: item.product, isActive: true, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { returnDocument: "after" }
      );
      if (!product) {
        const error = new Error(`${item.name} vừa hết hàng hoặc không đủ số lượng`);
        error.status = 409;
        throw error;
      }
      reserved.push(item);
    }
    if (reserved.length) {
      payment.inventoryStatus = "reserved";
      await payment.save();
    }
  } catch (error) {
    await Promise.all(reserved.map((item) =>
      Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } })
    ));
    throw error;
  }
}

async function restoreComboStock(payment) {
  if (payment.inventoryStatus !== "reserved") return;
  await Promise.all((payment.bookingData.combos || []).map((item) =>
    Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } })
  ));
  payment.inventoryStatus = "released";
  await payment.save();
}

function getConfig() {
  const config = {
    tmnCode: process.env.VNP_TMN_CODE,
    secret: process.env.VNP_HASH_SECRET,
    paymentUrl: process.env.VNP_PAYMENT_URL,
    returnUrl: process.env.VNP_RETURN_URL,
  };
  const missing = Object.entries(config).filter(([, value]) => !value).map(([key]) => key);
  if (missing.length) {
    const error = new Error(`VNPAY Sandbox chưa được cấu hình: ${missing.join(", ")}`);
    error.status = 503;
    throw error;
  }
  return config;
}

async function releasePayment(payment, status) {
  if (payment.status !== "cho_thanh_toan") return payment;
  const claimed = await Payment.findOneAndUpdate(
    { _id: payment._id, status: "cho_thanh_toan" },
    { $set: { status } },
    { returnDocument: "after" }
  );
  if (!claimed) return Payment.findById(payment._id);
  await restoreComboStock(claimed);
  await releaseVoucher(claimed);
  await BookedSeat.deleteMany({ payment: claimed._id });
  if (claimed.user) {
    await createNotification({
      user: claimed.user, type: "thanh_toan", entityId: claimed._id,
      action: "mo_thanh_toan", title: STATUS_LABELS[status],
      content: `Giao dịch ${claimed.orderCode} cho phim ${claimed.bookingData.movieTitle}: ${STATUS_LABELS[status].toLowerCase()}.`,
    });
  }
  return claimed;
}

async function releaseExpiredPayments() {
  const expired = await Payment.find({
    status: "cho_thanh_toan",
    expiresAt: { $lte: new Date() },
  });
  await Promise.all(expired.map((payment) => releasePayment(payment, "het_han")));
  return expired.length;
}

async function completePayment(payment, query) {
  if (payment.status === "da_thanh_toan") return payment;
  if (payment.status !== "cho_thanh_toan") return payment;

  const claimed = await Payment.findOneAndUpdate(
    { _id: payment._id, status: "cho_thanh_toan" },
    {
      $set: {
        status: "da_thanh_toan",
        paidAt: new Date(),
        transactionNo: query.vnp_TransactionNo,
        bankCode: query.vnp_BankCode,
        responseCode: query.vnp_ResponseCode,
      },
    },
    { returnDocument: "after" }
  );
  if (!claimed) return Payment.findById(payment._id);

  try {
    const data = claimed.bookingData;
    const booking = await QuickBooking.create({
      user: claimed.user,
      showtimeId: data.showtimeId,
      movieTitle: data.movieTitle,
      movieDuration: data.movieDuration,
      movieGenre: data.movieGenre,
      seats: data.seats,
      combos: data.combos,
      ticketTotal: data.ticketTotal,
      comboTotal: data.comboTotal,
      totalPrice: data.totalPrice,
      comboPickupCode: data.combos?.length
        ? `CB-${Math.floor(100000 + Math.random() * 900000)}`
        : undefined,
      comboStatus: data.combos?.length ? "cho_nhan" : "khong_co",
      paymentMethod: claimed.bankCode,
      voucher: claimed.voucher,
      voucherCode: claimed.voucherCode,
      discount: claimed.discount,
      subtotal: claimed.subtotal,
      cinema: data.cinema || "FilmGo Hà Trung (Thanh Hóa)",
      bookingDate: data.bookingDate,
      bookingTime: data.bookingTime,
      code: `FG-${Math.floor(100000 + Math.random() * 900000)}`,
      status: "paid",
    });

    await BookedSeat.updateMany(
      { payment: claimed._id },
      { $set: { booking: booking._id }, $unset: { payment: 1, expiresAt: 1 } }
    );
    claimed.booking = booking._id;
    if (claimed.inventoryStatus === "reserved") claimed.inventoryStatus = "committed";
    await claimed.save();
    if (claimed.userVoucher) {
      await UserVoucher.updateOne(
        { _id: claimed.userVoucher, status: "reserved", reservedPayment: claimed._id },
        { $set: { status: "used", usedAt: new Date(), booking: booking._id }, $unset: { reservedPayment: 1 } }
      );
    }
    if (claimed.user) {
      await createNotification({
        user: claimed.user, type: "dat_ve", entityId: booking._id, action: "mo_ve",
        title: "Đặt vé thành công",
        content: `Thanh toán ${Number(claimed.amount).toLocaleString("vi-VN")}đ thành công. Ghế ${data.seats.join(", ")} xem phim ${data.movieTitle} đã được xác nhận.`,
      });
    }
    return claimed;
  } catch (error) {
    await Payment.updateOne(
      { _id: claimed._id, booking: { $exists: false } },
      { $set: { status: "cho_thanh_toan" }, $unset: { paidAt: 1 } }
    );
    throw error;
  }
}

async function processVnpayResult(query) {
  const { secret } = getConfig();
  if (!verify(query, secret)) return { ok: false, code: "97", message: "Chữ ký không hợp lệ" };

  const payment = await Payment.findOne({ orderCode: query.vnp_TxnRef });
  if (!payment) return { ok: false, code: "01", message: "Không tìm thấy đơn hàng" };
  if (Number(query.vnp_Amount) !== payment.amount * 100) {
    return { ok: false, code: "04", message: "Số tiền không hợp lệ", payment };
  }

  if (query.vnp_ResponseCode === "00" && query.vnp_TransactionStatus === "00") {
    await completePayment(payment, query);
    return { ok: true, code: "00", message: "Thanh toán thành công", payment };
  }

  await releasePayment(payment, "that_bai");
  payment.responseCode = query.vnp_ResponseCode;
  await payment.save();
  return { ok: false, code: "00", message: "Thanh toán thất bại", payment };
}

const createVnpayPayment = async (req, res, next) => {
  let payment;
  try {
    const config = getConfig();
    const seats = normalizeSeats(req.body.seats);
    const showtimeId = String(req.body.showtimeId || "").trim();
    if (!showtimeId || !seats.length) {
      return res.status(400).json({
        success: false,
        message: "Thông tin suất chiếu hoặc ghế không hợp lệ",
      });
    }

    const showtime = await Showtime.findById(showtimeId).populate("movie", "title duration genre");
    if (!showtime || showtime.status !== "scheduled") {
      return res.status(404).json({ success: false, message: "Suất chiếu không tồn tại hoặc đã ngừng bán" });
    }
    const roomSeats = await Seat.find({ room: showtime.room, status: "active" }).lean();
    const seatByLabel = new Map(roomSeats.map((seat) => [`${seat.row}${seat.number}`.toUpperCase(), seat]));
    if (seats.some((label) => !seatByLabel.has(label))) {
      return res.status(400).json({ success: false, message: "Có ghế không thuộc phòng chiếu này" });
    }
    const unitPrice = Number(showtime.price);
    const ticketTotal = seats.reduce((total, label) => {
      const type = seatByLabel.get(label).type;
      return total + (["vip", "couple"].includes(type) ? Math.round(unitPrice * 1.2) : unitPrice);
    }, 0);
    const { combos, comboTotal } = await prepareCombos(req.body.combos);
    const subtotal = ticketTotal + comboTotal;
    const voucherInfo = await prepareVoucher(req.user?._id, req.body.voucherCode, subtotal);
    const amount = subtotal - voucherInfo.discount;
    const movieTitle = showtime.movie?.title || String(req.body.movieTitle || "").trim();

    const now = new Date();
    const expiresAt = new Date(now.getTime() + HOLD_MINUTES * 60 * 1000);
    const orderCode = `FG${Date.now()}${Math.floor(100 + Math.random() * 900)}`;
    payment = await Payment.create({
      user: req.user?._id,
      voucher: voucherInfo.voucher?._id,
      userVoucher: voucherInfo.userVoucher?._id,
      voucherCode: voucherInfo.voucher?.code,
      subtotal,
      discount: voucherInfo.discount,
      orderCode,
      amount,
      expiresAt,
      bookingData: {
        showtimeId,
        movieTitle,
        movieDuration: showtime.movie?.duration || req.body.movieDuration,
        movieGenre: normalizeGenre(showtime.movie?.genre || req.body.movieGenre),
        seats,
        combos,
        ticketTotal,
        comboTotal,
        totalPrice: amount,
        cinema: req.body.cinema,
        bookingDate: req.body.bookingDate,
        bookingTime: req.body.bookingTime,
      },
    });

    try {
      await BookedSeat.init();
      await BookedSeat.deleteMany({
        showtimeId,
        seatLabel: { $in: seats },
        expiresAt: { $lte: now },
      });
      await BookedSeat.insertMany(
        seats.map((seatLabel) => ({
          showtimeId,
          seatLabel,
          payment: payment._id,
          expiresAt,
        })),
        { ordered: true }
      );
      await reserveComboStock(payment);
      await reserveVoucher(payment);
    } catch (error) {
      await restoreComboStock(payment);
      await releaseVoucher(payment);
      await BookedSeat.deleteMany({ payment: payment._id });
      await Payment.deleteOne({ _id: payment._id });
      if (error?.code === 11000) {
        await notifyBookingFailure(req.user?._id, movieTitle, "Một hoặc nhiều ghế vừa được người khác giữ.");
        return res.status(409).json({ success: false, message: "Một hoặc nhiều ghế vừa được người khác giữ" });
      }
      throw error;
    }

    const ip = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1")
      .split(",")[0].trim().replace("::ffff:", "");
    const params = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: config.tmnCode,
      vnp_Amount: amount * 100,
      vnp_CurrCode: "VND",
      vnp_TxnRef: orderCode,
      vnp_OrderInfo: `Thanh toan ve phim ${movieTitle}`,
      vnp_OrderType: "other",
      vnp_Locale: "vn",
      vnp_ReturnUrl: config.returnUrl,
      vnp_IpAddr: ip === "::1" ? "127.0.0.1" : ip,
      vnp_CreateDate: formatVnpDate(now),
      vnp_ExpireDate: formatVnpDate(expiresAt),
    };
    const secureHash = sign(params, config.secret);
    const paymentUrl = `${config.paymentUrl}?${buildQuery(params)}&vnp_SecureHash=${secureHash}`;

    await notifyPendingPayment(payment);

    return res.status(201).json({
      success: true,
      data: {
        paymentId: String(payment._id),
        orderCode,
        paymentUrl,
        status: payment.status,
        statusLabel: STATUS_LABELS[payment.status],
        expiresAt,
      },
    });
  } catch (error) {
    if (payment?._id) {
      await restoreComboStock(payment);
      await releaseVoucher(payment);
      await BookedSeat.deleteMany({ payment: payment._id });
      await Payment.deleteOne({ _id: payment._id, status: "cho_thanh_toan" });
    }
    next(error);
  }
};

const createMockPayment = async (req, res, next) => {
  let payment;
  try {
    const seats = normalizeSeats(req.body.seats);
    const showtimeId = String(req.body.showtimeId || "").trim();
    if (!showtimeId || !seats.length) {
      return res.status(400).json({ success: false, message: "Thông tin suất chiếu hoặc ghế không hợp lệ" });
    }

    const showtime = await Showtime.findById(showtimeId).populate("movie", "title duration genre");
    if (!showtime || showtime.status !== "scheduled") {
      return res.status(404).json({ success: false, message: "Suất chiếu không tồn tại hoặc đã ngừng bán" });
    }
    const roomSeats = await Seat.find({ room: showtime.room, status: "active" }).lean();
    const seatByLabel = new Map(roomSeats.map((seat) => [`${seat.row}${seat.number}`.toUpperCase(), seat]));
    if (seats.some((label) => !seatByLabel.has(label))) {
      return res.status(400).json({ success: false, message: "Có ghế không thuộc phòng chiếu này" });
    }

    const unitPrice = Number(showtime.price);
    const ticketTotal = seats.reduce((total, label) => {
      const type = seatByLabel.get(label).type;
      return total + (["vip", "couple"].includes(type) ? Math.round(unitPrice * 1.2) : unitPrice);
    }, 0);
    const { combos, comboTotal } = await prepareCombos(req.body.combos);
    const subtotal = ticketTotal + comboTotal;
    const voucherInfo = await prepareVoucher(req.user?._id, req.body.voucherCode, subtotal);
    const amount = subtotal - voucherInfo.discount;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + HOLD_MINUTES * 60 * 1000);
    payment = await Payment.create({
      user: req.user?._id,
      voucher: voucherInfo.voucher?._id,
      userVoucher: voucherInfo.userVoucher?._id,
      voucherCode: voucherInfo.voucher?.code,
      subtotal,
      discount: voucherInfo.discount,
      orderCode: `MP${Date.now()}${Math.floor(100 + Math.random() * 900)}`,
      provider: "mo_phong",
      amount,
      expiresAt,
      bookingData: {
        showtimeId,
        movieTitle: showtime.movie?.title || String(req.body.movieTitle || "").trim(),
        movieDuration: showtime.movie?.duration || req.body.movieDuration,
        movieGenre: normalizeGenre(showtime.movie?.genre || req.body.movieGenre),
        seats,
        combos,
        ticketTotal,
        comboTotal,
        totalPrice: amount,
        cinema: req.body.cinema,
        bookingDate: req.body.bookingDate,
        bookingTime: req.body.bookingTime,
      },
    });

    try {
      await BookedSeat.init();
      await BookedSeat.deleteMany({
        showtimeId,
        seatLabel: { $in: seats },
        expiresAt: { $lte: now },
      });
      await BookedSeat.insertMany(
        seats.map((seatLabel) => ({ showtimeId, seatLabel, payment: payment._id, expiresAt })),
        { ordered: true }
      );
      await reserveComboStock(payment);
      await reserveVoucher(payment);
    } catch (error) {
      await restoreComboStock(payment);
      await releaseVoucher(payment);
      await BookedSeat.deleteMany({ payment: payment._id });
      await Payment.deleteOne({ _id: payment._id });
      if (error?.code === 11000) {
        await notifyBookingFailure(req.user?._id, payment.bookingData.movieTitle, "Một hoặc nhiều ghế vừa được người khác giữ.");
        return res.status(409).json({ success: false, message: "Một hoặc nhiều ghế vừa được người khác giữ" });
      }
      throw error;
    }

    await notifyPendingPayment(payment);

    return res.status(201).json({
      success: true,
      data: {
        paymentId: String(payment._id),
        orderCode: payment.orderCode,
        amount,
        status: payment.status,
        statusLabel: STATUS_LABELS[payment.status],
        expiresAt,
      },
    });
  } catch (error) {
    if (payment?._id) {
      await restoreComboStock(payment);
      await releaseVoucher(payment);
      await BookedSeat.deleteMany({ payment: payment._id });
      await Payment.deleteOne({ _id: payment._id, status: "cho_thanh_toan" });
    }
    next(error);
  }
};

const completeMockPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findOne({ _id: req.params.id, provider: "mo_phong", user: req.user._id });
    if (!payment) return res.status(404).json({ success: false, message: "Không tìm thấy giao dịch mô phỏng" });
    if (payment.status !== "cho_thanh_toan") {
      return res.status(409).json({ success: false, message: `Giao dịch đang ở trạng thái: ${STATUS_LABELS[payment.status]}` });
    }
    if (new Date(payment.expiresAt) <= new Date()) {
      await releasePayment(payment, "het_han");
      return res.status(410).json({ success: false, message: "Giao dịch đã hết thời gian thanh toán" });
    }
    const allowedBanks = ["MBBANK_MO_PHONG", "VCB_MO_PHONG", "NCB_MO_PHONG"];
    const bankCode = allowedBanks.includes(req.body.bankCode)
      ? req.body.bankCode
      : "MBBANK_MO_PHONG";
    const completed = await completePayment(payment, {
      vnp_TransactionNo: `MO_PHONG_${Date.now()}`,
      vnp_BankCode: bankCode,
      vnp_ResponseCode: "00",
    });
    return res.json({ success: true, message: "Thanh toán mô phỏng thành công", data: completed });
  } catch (error) {
    next(error);
  }
};

const failMockPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findOne({ _id: req.params.id, provider: "mo_phong", user: req.user._id });
    if (!payment) return res.status(404).json({ success: false, message: "Không tìm thấy giao dịch mô phỏng" });
    await releasePayment(payment, "that_bai");
    return res.json({ success: true, message: "Đã mô phỏng thanh toán thất bại và mở lại ghế" });
  } catch (error) {
    next(error);
  }
};

const vnpayIpn = async (req, res) => {
  try {
    const result = await processVnpayResult(req.query);
    return res.json({ RspCode: result.code, Message: result.message });
  } catch (error) {
    return res.json({ RspCode: "99", Message: error.message });
  }
};

const vnpayReturn = async (req, res) => {
  try {
    const result = await processVnpayResult(req.query);
    const title = result.ok ? "Thanh toán thành công" : "Thanh toán chưa thành công";
    return res.type("html").send(`<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${title}</title><body style="font-family:sans-serif;text-align:center;padding:48px"><h2>${title}</h2><p>${result.message}</p><p>Bạn có thể quay lại ứng dụng FilmGo.</p></body></html>`);
  } catch (error) {
    return res.status(400).send(`Không thể xác nhận thanh toán: ${error.message}`);
  }
};

const getPaymentStatus = async (req, res, next) => {
  try {
    let payment = await Payment.findOne({_id: req.params.id, user: req.user._id}).lean();
    if (!payment) return res.status(404).json({ success: false, message: "Không tìm thấy giao dịch" });
    if (payment.status === "cho_thanh_toan" && new Date(payment.expiresAt) <= new Date()) {
      await releasePayment(await Payment.findById(payment._id), "het_han");
      payment = await Payment.findById(payment._id).lean();
    }
    return res.json({
      success: true,
      data: { ...payment, statusLabel: STATUS_LABELS[payment.status] },
    });
  } catch (error) {
    next(error);
  }
};

const cancelPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findOne({_id: req.params.id, user: req.user._id});
    if (!payment) return res.status(404).json({ success: false, message: "Không tìm thấy giao dịch" });
    await releasePayment(payment, "da_huy");
    return res.json({ success: true, message: "Đã hủy thanh toán và mở lại ghế" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createMockPayment,
  completeMockPayment,
  failMockPayment,
  createVnpayPayment,
  vnpayIpn,
  vnpayReturn,
  getPaymentStatus,
  cancelPayment,
  releaseExpiredPayments,
};
