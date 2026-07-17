const QuickBooking = require("../models/QuickBooking");
const BookedSeat = require("../models/BookedSeat");

const normalizeSeats = (seats) =>
  [...new Set((Array.isArray(seats) ? seats : []).map((seat) =>
    String(seat).trim().toUpperCase()
  ).filter(Boolean))];

// GET /api/quick-bookings/sold-seats?showtimeId=...
const getSoldSeats = async (req, res, next) => {
  try {
    const showtimeId = String(req.query.showtimeId || "").trim();
    if (!showtimeId) {
      return res.status(400).json({
        success: false,
        message: "Thiếu showtimeId",
      });
    }

    const rows = await BookedSeat.find({
      showtimeId,
      $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: new Date() } }],
    })
      .select("seatLabel -_id")
      .sort({ seatLabel: 1 })
      .lean();

    return res.json({
      success: true,
      data: rows.map((row) => row.seatLabel),
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/quick-bookings — Tạo đặt vé mới
const create = async (req, res, next) => {
  try {
    const {
      showtimeId,
      movieTitle,
      movieDuration,
      movieGenre,
      seats,
      totalPrice,
      cinema,
      bookingDate,
      bookingTime,
    } = req.body;

    const normalizedShowtimeId = String(showtimeId || "").trim();
    const normalizedSeats = normalizeSeats(seats);

    if (!normalizedShowtimeId || !movieTitle || !normalizedSeats.length || !totalPrice) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin bắt buộc: showtimeId, movieTitle, seats, totalPrice",
      });
    }

    const code = "FG-" + Math.floor(100000 + Math.random() * 900000);

    const booking = new QuickBooking({
      user: req.user._id,
      showtimeId: normalizedShowtimeId,
      movieTitle,
      movieDuration,
      movieGenre,
      seats: normalizedSeats,
      totalPrice,
      cinema: cinema || "FilmGo Hà Trung (Thanh Hóa)",
      bookingDate,
      bookingTime,
      code,
      status: "paid",
    });

    try {
      await BookedSeat.init();
      await BookedSeat.insertMany(
        normalizedSeats.map((seatLabel) => ({
          showtimeId: normalizedShowtimeId,
          seatLabel,
          booking: booking._id,
        })),
        { ordered: true }
      );
      await booking.save();
    } catch (error) {
      await BookedSeat.deleteMany({ booking: booking._id });
      if (error?.code === 11000) {
        const unavailable = await BookedSeat.find({
          showtimeId: normalizedShowtimeId,
          seatLabel: { $in: normalizedSeats },
        }).distinct("seatLabel");
        return res.status(409).json({
          success: false,
          message: `Ghế ${unavailable.join(", ") || "đã chọn"} vừa được người khác đặt`,
          data: { unavailableSeats: unavailable },
        });
      }
      throw error;
    }

    res.status(201).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/quick-bookings — Lấy tất cả đặt vé (mới nhất trước)
const getAll = async (req, res, next) => {
  try {
    const bookings = await QuickBooking.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/quick-bookings/mine — chỉ vé của tài khoản đang đăng nhập
const getMine = async (req, res, next) => {
  try {
    const bookings = await QuickBooking.find({user: req.user._id}).sort({createdAt: -1});
    res.json({success: true, data: bookings});
  } catch (error) {
    next(error);
  }
};

// DELETE /api/quick-bookings/:id — Xoá vé
const remove = async (req, res, next) => {
  try {
    const booking = await QuickBooking.findByIdAndDelete(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Không tìm thấy vé" });
    }
    await BookedSeat.deleteMany({ booking: booking._id });
    res.json({ success: true, message: "Đã xoá vé thành công" });
  } catch (error) {
    next(error);
  }
};

module.exports = { create, getAll, getMine, getSoldSeats, remove };
