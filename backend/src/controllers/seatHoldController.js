const BookedSeat = require("../models/BookedSeat");
const Showtime = require("../models/Showtime");
const Seat = require("../models/Seat");

const HOLD_MINUTES = 15;

const normalizeSeats = (seats) =>
  [...new Set((Array.isArray(seats) ? seats : [])
    .map((seat) => String(seat).trim().toUpperCase())
    .filter(Boolean))];

async function ensureSeatsBelongToShowtime(showtimeId, seats) {
  const showtime = await Showtime.findById(showtimeId).select("room status");
  if (!showtime || showtime.status !== "scheduled") {
    const error = new Error("Suất chiếu không tồn tại hoặc đã ngừng bán");
    error.status = 404;
    throw error;
  }

  const roomSeats = await Seat.find({
    room: showtime.room,
    status: "active",
  }).select("row number");
  const valid = new Set(roomSeats.map((seat) => `${seat.row}${seat.number}`.toUpperCase()));
  if (seats.some((seat) => !valid.has(seat))) {
    const error = new Error("Có ghế không thuộc phòng chiếu này");
    error.status = 400;
    throw error;
  }
}

async function holdSeats(req, res, next) {
  try {
    const showtimeId = String(req.body.showtimeId || "").trim();
    const holdToken = String(req.body.holdToken || "").trim();
    const seats = normalizeSeats(req.body.seatLabels);
    if (!showtimeId || !holdToken || !seats.length) {
      return res.status(400).json({
        success: false,
        message: "Thiếu showtimeId, holdToken hoặc seatLabels",
      });
    }

    await ensureSeatsBelongToShowtime(showtimeId, seats);
    const now = new Date();
    await BookedSeat.deleteMany({
      showtimeId,
      status: "held",
      expiresAt: { $lte: now },
    });

    // Cập nhật phiên giữ của chính người dùng trước khi thêm ghế mới.
    await BookedSeat.deleteMany({
      showtimeId,
      user: req.user._id,
      holdToken,
      status: "held",
    });

    try {
      const expiresAt = new Date(now.getTime() + HOLD_MINUTES * 60 * 1000);
      await BookedSeat.insertMany(
        seats.map((seatLabel) => ({
          showtimeId,
          seatLabel,
          user: req.user._id,
          holdToken,
          status: "held",
          expiresAt,
        })),
        { ordered: true },
      );
      return res.status(201).json({
        success: true,
        data: { holdToken, showtimeId, seatLabels: seats, expiresAt },
      });
    } catch (error) {
      if (error?.code === 11000) {
        const unavailable = await BookedSeat.find({
          showtimeId,
          seatLabel: { $in: seats },
          $or: [
            { status: "booked" },
            { status: "held", expiresAt: { $gt: now } },
          ],
        }).distinct("seatLabel");
        return res.status(409).json({
          success: false,
          message: `Ghế ${unavailable.join(", ") || "đã chọn"} đang được người khác giữ`,
          data: { unavailableSeats: unavailable },
        });
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
}

async function releaseSeats(req, res, next) {
  try {
    const showtimeId = String(req.query.showtimeId || req.body.showtimeId || "").trim();
    const holdToken = String(req.params.holdToken || req.body.holdToken || "").trim();
    const filter = { user: req.user._id, holdToken, status: "held" };
    if (showtimeId) filter.showtimeId = showtimeId;
    const result = await BookedSeat.deleteMany(filter);
    return res.json({ success: true, released: result.deletedCount || 0 });
  } catch (error) {
    next(error);
  }
}

module.exports = { holdSeats, releaseSeats };
