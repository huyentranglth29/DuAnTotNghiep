const QuickBooking = require("../models/QuickBooking");

// POST /api/quick-bookings — Tạo đặt vé mới
const create = async (req, res, next) => {
  try {
    const {
      movieTitle,
      movieDuration,
      movieGenre,
      seats,
      totalPrice,
      cinema,
      bookingDate,
      bookingTime,
    } = req.body;

    if (!movieTitle || !seats || seats.length === 0 || !totalPrice) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin bắt buộc: movieTitle, seats, totalPrice",
      });
    }

    const code = "FG-" + Math.floor(100000 + Math.random() * 900000);

    const booking = await QuickBooking.create({
      movieTitle,
      movieDuration,
      movieGenre,
      seats,
      totalPrice,
      cinema: cinema || "Cine Prestige Hà Trung (Thanh Hóa)",
      bookingDate,
      bookingTime,
      code,
      status: "paid",
    });

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

// DELETE /api/quick-bookings/:id — Xoá vé
const remove = async (req, res, next) => {
  try {
    const booking = await QuickBooking.findByIdAndDelete(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Không tìm thấy vé" });
    }
    res.json({ success: true, message: "Đã xoá vé thành công" });
  } catch (error) {
    next(error);
  }
};

module.exports = { create, getAll, remove };
