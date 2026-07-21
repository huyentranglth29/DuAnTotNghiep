const Showtime = require("../models/Showtime");
const Seat = require("../models/Seat");
const BookedSeat = require("../models/BookedSeat");

const SEAT_TYPES = ["normal", "vip", "couple"];

/** Điều kiện BookedSeat còn hiệu lực (chưa hết hạn giữ) */
const notExpiredMatch = () => ({
  $or: [
    { expiresAt: { $exists: false } },
    { expiresAt: null },
    { expiresAt: { $gt: new Date() } },
  ],
});

/**
 * Ghế còn vé/giữ ở các suất chưa chiếu xong của phòng.
 * Dùng để chặn khóa / đổi loại ghế đang phục vụ khách.
 */
const findActiveUsage = async (seat) => {
  const label = `${seat.row}${seat.number}`.toUpperCase();
  const showtimes = await Showtime.find({
    room: seat.room,
    endTime: { $gte: new Date() },
    status: { $ne: "cancelled" },
  })
    .select("_id")
    .lean();

  if (!showtimes.length) return null;

  const usage = await BookedSeat.findOne({
    showtimeId: { $in: showtimes.map((item) => String(item._id)) },
    seatLabel: label,
    ...notExpiredMatch(),
  })
    .select("status showtimeId")
    .lean();

  return usage;
};

/** Giá vé theo loại ghế — đồng bộ công thức với paymentController */
const seatPrice = (basePrice, type) =>
  ["vip", "couple"].includes(type) ? Math.round(basePrice * 1.2) : basePrice;

const displayName = (user) =>
  user?.fullName || user?.email || user?.phone || "Khách";

/**
 * Sơ đồ ghế realtime của một suất chiếu cho Admin.
 * Gộp: Seat (bảo trì/loại ghế) + BookedSeat (giữ/đã bán) + QuickBooking (check-in, khách hàng).
 */
const getSeatMap = async (req, res, next) => {
  try {
    const showtime = await Showtime.findById(req.params.showtimeId)
      .populate("movie", "title duration")
      .populate("room", "name type totalSeats status");

    if (!showtime) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy suất chiếu" });
    }

    const now = new Date();
    const [seats, occupiedRows] = await Promise.all([
      Seat.find({ room: showtime.room._id })
        .sort({ row: 1, number: 1 })
        .lean(),
      BookedSeat.find({
        showtimeId: String(showtime._id),
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: null },
          { expiresAt: { $gt: now } },
        ],
      })
        .populate("user", "fullName email phone")
        .populate({
          path: "booking",
          select:
            "code status checkedIn checkedInAt paymentMethod createdAt user",
          populate: { path: "user", select: "fullName email phone" },
        })
        .lean(),
    ]);

    const occupiedByLabel = new Map(
      occupiedRows.map((row) => [String(row.seatLabel).toUpperCase(), row]),
    );

    const basePrice = Number(showtime.price) || 0;

    const mappedSeats = seats.map((seat) => {
      const label = `${seat.row}${seat.number}`.toUpperCase();
      const occupied = occupiedByLabel.get(label);

      let status = "available";
      let hold = null;
      let order = null;

      if (seat.status === "inactive") {
        status = "maintenance";
      } else if (occupied) {
        if (occupied.status === "held") {
          status = "held";
          hold = {
            heldBy: displayName(occupied.user),
            heldAt: occupied.createdAt || null,
            expiresAt: occupied.expiresAt || null,
          };
        } else {
          const booking = occupied.booking;
          const isCancelled =
            booking && ["cancelled", "refunded"].includes(booking.status);
          if (!isCancelled) {
            status = booking?.checkedIn ? "checked_in" : "sold";
            order = booking
              ? {
                  id: String(booking._id),
                  code:
                    booking.code ||
                    `DH-${String(booking._id).slice(-6).toUpperCase()}`,
                  customerName: displayName(booking.user),
                  customerPhone: booking.user?.phone || "",
                  customerEmail: booking.user?.email || "",
                  paymentMethod: booking.paymentMethod || "",
                  bookedAt: booking.createdAt || null,
                  checkedInAt: booking.checkedInAt || null,
                }
              : null;
          }
        }
      }

      return {
        id: String(seat._id),
        label,
        row: seat.row,
        number: seat.number,
        type: seat.type || "normal",
        status,
        price: seatPrice(basePrice, seat.type),
        hold,
        order,
      };
    });

    const stats = {
      total: mappedSeats.length,
      available: 0,
      held: 0,
      sold: 0,
      checkedIn: 0,
      maintenance: 0,
    };
    mappedSeats.forEach((seat) => {
      if (seat.status === "available") stats.available += 1;
      else if (seat.status === "held") stats.held += 1;
      else if (seat.status === "sold") stats.sold += 1;
      else if (seat.status === "checked_in") stats.checkedIn += 1;
      else if (seat.status === "maintenance") stats.maintenance += 1;
    });

    return res.json({
      success: true,
      message: "Sơ đồ ghế suất chiếu",
      data: {
        showtime: {
          id: String(showtime._id),
          startTime: showtime.startTime,
          endTime: showtime.endTime,
          price: basePrice,
          status: showtime.status,
          movie: showtime.movie
            ? { id: String(showtime.movie._id), title: showtime.movie.title }
            : null,
        },
        room: showtime.room,
        seats: mappedSeats,
        stats,
      },
    });
  } catch (error) {
    next(error);
  }
};

/** Thu hồi ghế đang giữ (xóa hold để ghế trống lại ngay) */
const releaseHeldSeat = async (req, res, next) => {
  try {
    const seatLabel = String(req.body.seatLabel || "").trim().toUpperCase();
    if (!seatLabel) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu mã ghế cần thu hồi" });
    }

    const hold = await BookedSeat.findOne({
      showtimeId: String(req.params.showtimeId),
      seatLabel,
      status: "held",
    })
      .select("payment")
      .lean();

    if (!hold) {
      return res.status(409).json({
        success: false,
        message: "Ghế không ở trạng thái đang giữ (có thể đã hết hạn hoặc đã bán)",
      });
    }

    // Hold đã gắn giao dịch = khách đang ở màn thanh toán → không được thu hồi (tránh bán trùng ghế)
    if (hold.payment) {
      return res.status(409).json({
        success: false,
        message: "Khách đang thanh toán ghế này — không thể thu hồi. Chờ giao dịch hoàn tất hoặc hết hạn giữ.",
      });
    }

    await BookedSeat.deleteOne({ _id: hold._id, status: "held" });

    return res.json({
      success: true,
      message: `Đã thu hồi ghế ${seatLabel}`,
      data: { seatLabel },
    });
  } catch (error) {
    next(error);
  }
};

/** Khóa ghế (bảo trì) — chặn nếu ghế còn vé/giữ ở suất chưa chiếu xong */
const lockSeat = async (req, res, next) => {
  try {
    const seat = await Seat.findById(req.params.seatId);
    if (!seat) {
      return res.status(404).json({ success: false, message: "Không tìm thấy ghế" });
    }
    if (seat.status === "inactive") {
      return res.status(409).json({ success: false, message: "Ghế đã ở trạng thái bảo trì" });
    }

    const usage = await findActiveUsage(seat);
    if (usage) {
      return res.status(409).json({
        success: false,
        message:
          usage.status === "booked"
            ? "Ghế này đã có vé bán ở suất chiếu khác chưa diễn ra — không thể khóa."
            : "Ghế này đang được khách giữ ở suất chiếu khác — không thể khóa.",
      });
    }

    seat.status = "inactive";
    await seat.save();
    return res.json({
      success: true,
      message: `Đã khóa ghế ${seat.row}${seat.number}`,
      data: { seatId: String(seat._id) },
    });
  } catch (error) {
    next(error);
  }
};

/** Mở lại ghế bảo trì */
const unlockSeat = async (req, res, next) => {
  try {
    const seat = await Seat.findById(req.params.seatId);
    if (!seat) {
      return res.status(404).json({ success: false, message: "Không tìm thấy ghế" });
    }
    seat.status = "active";
    await seat.save();
    return res.json({
      success: true,
      message: `Đã mở ghế ${seat.row}${seat.number}`,
      data: { seatId: String(seat._id) },
    });
  } catch (error) {
    next(error);
  }
};

/** Đổi loại ghế — chặn nếu ghế còn vé/giữ ở suất chưa chiếu xong (giá sẽ lệch) */
const changeSeatType = async (req, res, next) => {
  try {
    const type = String(req.body.type || "").trim();
    if (!SEAT_TYPES.includes(type)) {
      return res.status(400).json({ success: false, message: "Loại ghế không hợp lệ" });
    }

    const seat = await Seat.findById(req.params.seatId);
    if (!seat) {
      return res.status(404).json({ success: false, message: "Không tìm thấy ghế" });
    }

    if (seat.type !== type) {
      const usage = await findActiveUsage(seat);
      if (usage) {
        return res.status(409).json({
          success: false,
          message: "Ghế còn vé hoặc đang được giữ ở suất chưa diễn ra — không thể đổi loại.",
        });
      }
      seat.type = type;
      await seat.save();
    }

    return res.json({
      success: true,
      message: `Đã đổi ghế ${seat.row}${seat.number} sang loại ${type}`,
      data: { seatId: String(seat._id), type },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSeatMap,
  releaseHeldSeat,
  lockSeat,
  unlockSeat,
  changeSeatType,
};
