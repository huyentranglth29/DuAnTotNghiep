const mongoose = require("mongoose");
const Voucher = require("../models/Voucher");
const UserVoucher = require("../models/UserVoucher");
const Booking = require("../models/Booking");
const Showtime = require("../models/Showtime");
const Seat = require("../models/Seat");
const Movie = require("../models/Movie");
const QuickBooking = require("../models/QuickBooking");

const ok = (res, data, message = "OK", status = 200) =>
  res.status(status).json({ success: true, message, data });

const fail = (res, status, message) =>
  res.status(status).json({ success: false, message });

const publicVoucher = (voucher) => ({
  _id: voucher._id,
  code: voucher.code,
  description: voucher.description,
  discountType: voucher.discountType,
  discountValue: voucher.discountValue,
  minOrderValue: voucher.minOrderValue || 0,
  maxDiscount: voucher.maxDiscount,
  quantity: voucher.quantity,
  startDate: voucher.startDate,
  endDate: voucher.endDate,
  status: voucher.status,
});

const isVoucherCurrentlyValid = (voucher, now = new Date()) => {
  if (!voucher) return false;
  if (voucher.status !== "active") return false;
  if (voucher.startDate && new Date(voucher.startDate) > now) return false;
  if (voucher.endDate && new Date(voucher.endDate) < now) return false;
  return true;
};

const calcDiscount = (voucher, orderValue) => {
  const amount = Math.max(0, Number(orderValue) || 0);
  if (amount < Number(voucher.minOrderValue || 0)) {
    return {
      ok: false,
      message: `Đơn tối thiểu ${Number(voucher.minOrderValue || 0).toLocaleString("vi-VN")}đ`,
      discount: 0,
    };
  }

  let discount = 0;
  if (voucher.discountType === "percent") {
    discount = Math.round((amount * Number(voucher.discountValue)) / 100);
    if (voucher.maxDiscount != null) {
      discount = Math.min(discount, Number(voucher.maxDiscount));
    }
  } else {
    discount = Number(voucher.discountValue) || 0;
  }

  discount = Math.min(discount, amount);
  return { ok: true, discount, message: "Áp dụng thành công" };
};

const getUsedCount = async (voucherId) => {
  const [bookings, quickBookings] = await Promise.all([
    Booking.countDocuments({ voucher: voucherId, status: { $ne: "cancelled" } }),
    QuickBooking.countDocuments({ voucher: voucherId, status: "paid" }),
  ]);
  return bookings + quickBookings;
};

/** GET /api/vouchers/active — danh sách voucher đang mở */
const listActive = async (req, res) => {
  try {
    const now = new Date();
    const vouchers = await Voucher.find({
      status: "active",
      startDate: { $lte: now },
      endDate: { $gte: now },
    })
      .sort({ createdAt: -1 })
      .lean();

    const data = await Promise.all(
      vouchers.map(async (v) => {
        const usedCount = await getUsedCount(v._id);
        return {
          ...publicVoucher(v),
          usedCount,
          remaining: Math.max(0, Number(v.quantity || 0) - usedCount),
        };
      })
    );

    return ok(res, data);
  } catch (error) {
    return fail(res, 500, error.message);
  }
};

/** POST /api/vouchers/validate — { code, orderValue } */
const validate = async (req, res) => {
  try {
    const code = String(req.body.code || "").trim().toUpperCase();
    const orderValue = Number(req.body.orderValue || 0);

    if (!code) {
      return fail(res, 400, "Vui lòng nhập mã voucher");
    }

    const voucher = await Voucher.findOne({ code }).lean();
    if (!voucher) {
      return fail(res, 404, "Mã voucher không tồn tại");
    }

    if (!isVoucherCurrentlyValid(voucher)) {
      return fail(res, 400, "Voucher không còn hiệu lực");
    }

    const usedCount = await getUsedCount(voucher._id);
    if (voucher.quantity > 0 && usedCount >= voucher.quantity) {
      return fail(res, 400, "Voucher đã hết lượt sử dụng");
    }

    const result = calcDiscount(voucher, orderValue);
    if (!result.ok) {
      return fail(res, 400, result.message);
    }

    return ok(res, {
      voucher: publicVoucher(voucher),
      discount: result.discount,
      payable: Math.max(0, orderValue - result.discount),
      usedCount,
    });
  } catch (error) {
    return fail(res, 500, error.message);
  }
};

/** POST /api/vouchers/claim — lưu vào kho user { code } */
const claim = async (req, res) => {
  try {
    const code = String(req.body.code || "").trim().toUpperCase();
    if (!code) {
      return fail(res, 400, "Vui lòng nhập mã voucher");
    }

    const voucher = await Voucher.findOne({ code });
    if (!voucher) {
      return fail(res, 404, "Mã voucher không tồn tại");
    }

    if (!isVoucherCurrentlyValid(voucher)) {
      return fail(res, 400, "Voucher không còn hiệu lực");
    }

    const existing = await UserVoucher.findOne({
      user: req.user._id,
      voucher: voucher._id,
    });

    if (existing) {
      return ok(res, {
        ...publicVoucher(voucher),
        walletStatus: existing.status,
      }, "Voucher đã có trong kho");
    }

    const saved = await UserVoucher.create({
      user: req.user._id,
      voucher: voucher._id,
      status: "available",
    });

    return ok(
      res,
      {
        ...publicVoucher(voucher),
        walletStatus: saved.status,
      },
      "Đã thêm voucher vào kho",
      201
    );
  } catch (error) {
    if (error.code === 11000) {
      return fail(res, 400, "Voucher đã có trong kho");
    }
    return fail(res, 500, error.message);
  }
};

/** GET /api/vouchers/mine */
const myVouchers = async (req, res) => {
  try {
    const rows = await UserVoucher.find({ user: req.user._id })
      .populate("voucher")
      .sort({ createdAt: -1 })
      .lean();

    const now = new Date();
    const data = rows
      .filter((row) => row.voucher)
      .map((row) => {
        let walletStatus = row.status;
        if (
          walletStatus === "available" &&
          row.voucher.endDate &&
          new Date(row.voucher.endDate) < now
        ) {
          walletStatus = "expired";
        }

        return {
          walletId: row._id,
          walletStatus,
          usedAt: row.usedAt,
          claimedAt: row.createdAt,
          ...publicVoucher(row.voucher),
        };
      });

    return ok(res, data);
  } catch (error) {
    return fail(res, 500, error.message);
  }
};

/** GET /api/vouchers/history?status=all|used|expired */
const myHistory = async (req, res) => {
  try {
    const filter = String(req.query.status || "all");
    const rows = await UserVoucher.find({ user: req.user._id })
      .populate("voucher")
      .populate({
        path: "booking",
        select: "totalPrice status createdAt paymentStatus",
      })
      .sort({ updatedAt: -1 })
      .lean();

    const now = new Date();
    let data = rows
      .filter((row) => row.voucher)
      .map((row) => {
        let walletStatus = row.status;
        if (
          walletStatus === "available" &&
          row.voucher.endDate &&
          new Date(row.voucher.endDate) < now
        ) {
          walletStatus = "expired";
        }

        return {
          walletId: row._id,
          walletStatus,
          usedAt: row.usedAt,
          booking: row.booking || null,
          ...publicVoucher(row.voucher),
        };
      });

    if (filter === "used") {
      data = data.filter((item) => item.walletStatus === "used");
    } else if (filter === "expired") {
      data = data.filter((item) => item.walletStatus === "expired");
    }

    return ok(res, data);
  } catch (error) {
    return fail(res, 500, error.message);
  }
};

/**
 * POST /api/bookings/checkout
 * Body: { totalPrice, voucherCode?, paymentMethod?, showtimeId?, seatIds? }
 * Ghi booking thật (có voucher) → admin charts đếm được.
 */
const checkout = async (req, res) => {
  try {
    const totalPrice = Number(req.body.totalPrice);
    if (!Number.isFinite(totalPrice) || totalPrice < 0) {
      return fail(res, 400, "totalPrice không hợp lệ");
    }

    let showtimeId = req.body.showtimeId;
    let seatIds = Array.isArray(req.body.seatIds) ? req.body.seatIds : [];
    const movieId = req.body.movieId;
    let movieTitle = String(req.body.movieTitle || "").trim();

    if (!showtimeId) {
      let showtime = null;
      if (movieId && mongoose.Types.ObjectId.isValid(movieId)) {
        showtime = await Showtime.findOne({
          movie: movieId,
          status: "scheduled",
        }).sort({ startTime: 1 });
      }
      if (!showtime) {
        showtime = await Showtime.findOne({ status: "scheduled" }).sort({
          startTime: 1,
        });
      }
      if (!showtime) {
        return fail(res, 400, "Chưa có suất chiếu để tạo booking demo");
      }
      showtimeId = showtime._id;
    }

    // Luôn ưu tiên tên phim client gửi; nếu thiếu thì lấy từ suất / movieId
    if (!movieTitle && movieId && mongoose.Types.ObjectId.isValid(movieId)) {
      const movieDoc = await Movie.findById(movieId).select("title");
      movieTitle = movieDoc?.title || "";
    }
    if (!movieTitle) {
      const st = await Showtime.findById(showtimeId).populate("movie", "title");
      movieTitle = st?.movie?.title || "";
    }
    if (!movieTitle) {
      return fail(res, 400, "Thiếu tên phim để tạo vé");
    }

    if (!seatIds.length) {
      const seat = await Seat.findOne({ status: "active" });
      if (!seat) {
        return fail(res, 400, "Chưa có ghế để tạo booking demo");
      }
      seatIds = [seat._id];
    }

    let voucher = null;
    let discount = 0;
    const code = String(req.body.voucherCode || "").trim().toUpperCase();

    if (code) {
      voucher = await Voucher.findOne({ code });
      if (!voucher || !isVoucherCurrentlyValid(voucher)) {
        return fail(res, 400, "Voucher không hợp lệ");
      }

      const usedCount = await getUsedCount(voucher._id);
      if (voucher.quantity > 0 && usedCount >= voucher.quantity) {
        return fail(res, 400, "Voucher đã hết lượt");
      }

      const result = calcDiscount(voucher, totalPrice);
      if (!result.ok) {
        return fail(res, 400, result.message);
      }
      discount = result.discount;
    }

    const payable = Math.max(0, totalPrice - discount);
    const paymentMethod = ["cash", "card", "momo", "vnpay"].includes(
      req.body.paymentMethod
    )
      ? req.body.paymentMethod
      : "momo";

    const seatLabels = Array.isArray(req.body.seatLabels)
      ? req.body.seatLabels.map((s) => String(s).trim()).filter(Boolean)
      : [];

    let roomName = String(req.body.roomName || "").trim();
    let cinemaName = String(req.body.cinemaName || "").trim() || "FilmGo Hà Trung (Thanh Hóa)";

    if (!roomName) {
      const populatedShowtime = await Showtime.findById(showtimeId).populate(
        "room",
        "name"
      );
      roomName = populatedShowtime?.room?.name || "Phòng chiếu";
    }

    const ticketCode = `FG${Date.now().toString(36).toUpperCase()}${Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase()}`;

    const booking = await Booking.create({
      user: req.user._id,
      showtime: showtimeId,
      seats: seatIds,
      seatLabels,
      movieTitle,
      cinemaName,
      roomName,
      ticketCode,
      voucher: voucher ? voucher._id : undefined,
      totalPrice: payable,
      status: "paid",
      paymentMethod,
      paymentStatus: "paid",
    });

    if (voucher) {
      await UserVoucher.findOneAndUpdate(
        { user: req.user._id, voucher: voucher._id },
        {
          $set: {
            status: "used",
            usedAt: new Date(),
            booking: booking._id,
          },
          $setOnInsert: {
            user: req.user._id,
            voucher: voucher._id,
          },
        },
        { upsert: true, returnDocument: "after" }
      );
    }

    const populated = await Booking.findById(booking._id)
      .populate("voucher")
      .populate("seats")
      .populate({
        path: "showtime",
        populate: [
          { path: "movie", select: "title genre posterUrl duration" },
          { path: "room", select: "name type" },
        ],
      })
      .lean();

    return ok(
      res,
      {
        booking: populated,
        discount,
        originalTotal: totalPrice,
        payable,
      },
      "Thanh toán thành công",
      201
    );
  } catch (error) {
    return fail(res, 500, error.message);
  }
};

/** GET /api/bookings/mine */
const myBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("voucher")
      .populate("seats")
      .populate({
        path: "showtime",
        populate: [
          { path: "movie", select: "title genre posterUrl duration" },
          { path: "room", select: "name type" },
        ],
      })
      .sort({ createdAt: -1 })
      .lean();

    const data = await Promise.all(
      bookings.map(async (item) => {
        let movieTitle =
          item.movieTitle ||
          item.showtime?.movie?.title ||
          "";

        if (!movieTitle && item.showtime?.movie) {
          const movieId =
            typeof item.showtime.movie === "object"
              ? item.showtime.movie._id
              : item.showtime.movie;
          if (movieId) {
            const movieDoc = await Movie.findById(movieId).select("title").lean();
            movieTitle = movieDoc?.title || "";
          }
        }

        if (!movieTitle && item.showtime?._id) {
          const st = await Showtime.findById(item.showtime._id)
            .populate("movie", "title")
            .lean();
          movieTitle = st?.movie?.title || "";
        }

        // Bổ sung snapshot nếu thiếu (vé cũ)
        if (movieTitle && !item.movieTitle) {
          await Booking.updateOne(
            { _id: item._id },
            { $set: { movieTitle } }
          );
        }

        return { ...item, movieTitle };
      })
    );

    return ok(res, data);
  } catch (error) {
    return fail(res, 500, error.message);
  }
};

module.exports = {
  listActive,
  validate,
  claim,
  myVouchers,
  myHistory,
  checkout,
  myBookings,
  calcDiscount,
  isVoucherCurrentlyValid,
  publicVoucher,
};
