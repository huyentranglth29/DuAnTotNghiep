const mongoose = require("mongoose");
const QuickBooking = require("../models/QuickBooking");
const Showtime = require("../models/Showtime");
const User = require("../models/User");
const BookedSeat = require("../models/BookedSeat");
const Movie = require("../models/Movie");
const { createNotification } = require("../services/notificationService");

const PAYMENT_LABEL = {
  pending: "cho_thanh_toan",
  paid: "da_thanh_toan",
  cancelled: "da_huy",
  refunded: "da_hoan_tien",
};

const formatShowtimeLabel = (booking, showtime) => {
  if (showtime?.startTime) {
    return new Date(showtime.startTime).toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }
  if (booking.bookingDate || booking.bookingTime) {
    return [booking.bookingTime, booking.bookingDate].filter(Boolean).join(" · ");
  }
  return "";
};

const mapOrder = (booking, showtimeMap = {}, posterMap = {}) => {
  const showtime = showtimeMap[String(booking.showtimeId || "")] || null;
  const user = booking.user && typeof booking.user === "object" ? booking.user : null;
  const paymentKey = PAYMENT_LABEL[booking.status] || "cho_thanh_toan";
  const code = booking.code || `DH-${String(booking._id).slice(-6).toUpperCase()}`;
  const movieTitle =
    booking.movieTitle || showtime?.movie?.title || "Phim chưa xác định";
  const moviePoster =
    showtime?.movie?.posterUrl ||
    showtime?.movie?.poster ||
    posterMap[movieTitle.toLowerCase()] ||
    "";

  return {
    _id: booking._id,
    id: booking._id,
    code,
    customerName: user?.fullName || user?.email || "Khách FilmGo",
    customerPhone: user?.phone || "",
    customerEmail: user?.email || "",
    movieTitle,
    moviePoster,
    showtimeLabel: formatShowtimeLabel(booking, showtime),
    roomName: showtime?.room?.name || "",
    cinema: booking.cinema || "FilmGo Hà Trung (Thanh Hóa)",
    seats: Array.isArray(booking.seats) ? booking.seats : [],
    ticketCount: Array.isArray(booking.seats) ? booking.seats.length : 0,
    totalPrice: Number(booking.totalPrice || 0),
    paymentStatus: paymentKey,
    status: booking.status,
    checkedIn: Boolean(booking.checkedIn),
    checkedInAt: booking.checkedInAt || null,
    paymentMethod: booking.paymentMethod || "",
    combos: booking.combos || [],
    voucherCode: booking.voucherCode || "",
    discount: Number(booking.discount || 0),
    note: booking.note || "",
    cancelReason: booking.cancelReason || "",
    cancelledAt: booking.cancelledAt || null,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
    timeline: {
      bookedAt: booking.createdAt,
      paidAt: booking.status === "paid" || booking.status === "refunded" ? booking.updatedAt || booking.createdAt : null,
      ticketIssuedAt:
        booking.status === "paid" || booking.status === "refunded" ? booking.createdAt : null,
      checkedInAt: booking.checkedInAt || null,
      completedAt: booking.checkedIn ? booking.checkedInAt : null,
      cancelledAt: booking.cancelledAt || null,
    },
  };
};

const loadShowtimeMap = async (bookings) => {
  const ids = [
    ...new Set(
      bookings
        .map((item) => String(item.showtimeId || "").trim())
        .filter((id) => mongoose.Types.ObjectId.isValid(id)),
    ),
  ];
  if (!ids.length) return {};

  const showtimes = await Showtime.find({ _id: { $in: ids } })
    .populate("movie", "title poster posterUrl")
    .populate("room", "name")
    .lean();

  return Object.fromEntries(showtimes.map((item) => [String(item._id), item]));
};

/** Map tên phim (lowercase) → poster, cho đơn không còn liên kết suất chiếu */
const loadPosterMap = async (bookings) => {
  const titles = [
    ...new Set(
      bookings.map((item) => String(item.movieTitle || "").trim()).filter(Boolean),
    ),
  ];
  if (!titles.length) return {};

  const movies = await Movie.find({ title: { $in: titles } })
    .select("title poster posterUrl")
    .lean();

  return Object.fromEntries(
    movies.map((movie) => [
      String(movie.title || "").toLowerCase(),
      movie.posterUrl || movie.poster || "",
    ]),
  );
};

const listOrders = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
    const keyword = String(req.query.keyword || "").trim();
    const movie = String(req.query.movie || "").trim();
    const date = String(req.query.date || "").trim();
    const payment = String(req.query.payment || "").trim();
    const checkIn = String(req.query.checkIn || "").trim();

    const filter = {};

    if (movie) {
      filter.movieTitle = { $regex: movie, $options: "i" };
    }

    if (payment === "da_thanh_toan") filter.status = "paid";
    if (payment === "cho_thanh_toan") filter.status = "pending";
    if (payment === "da_huy") filter.status = { $in: ["cancelled", "refunded"] };

    if (checkIn === "da_check_in") filter.checkedIn = true;
    if (checkIn === "chua_check_in") filter.checkedIn = { $ne: true };

    if (date) {
      const start = new Date(`${date}T00:00:00.000`);
      const end = new Date(`${date}T23:59:59.999`);
      if (!Number.isNaN(start.getTime())) {
        filter.createdAt = { $gte: start, $lte: end };
      }
    }

    if (keyword) {
      const users = await User.find({
        $or: [
          { fullName: { $regex: keyword, $options: "i" } },
          { phone: { $regex: keyword, $options: "i" } },
          { email: { $regex: keyword, $options: "i" } },
        ],
      })
        .select("_id")
        .lean();

      filter.$or = [
        { code: { $regex: keyword, $options: "i" } },
        { movieTitle: { $regex: keyword, $options: "i" } },
        { user: { $in: users.map((item) => item._id) } },
      ];
    }

    const [total, rows] = await Promise.all([
      QuickBooking.countDocuments(filter),
      QuickBooking.find(filter)
        .populate("user", "fullName email phone")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    const [showtimeMap, posterMap] = await Promise.all([
      loadShowtimeMap(rows),
      loadPosterMap(rows),
    ]);
    const data = rows.map((row) => mapOrder(row, showtimeMap, posterMap));

    return res.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getOrderMovies = async (req, res) => {
  try {
    const titles = await QuickBooking.distinct("movieTitle");
    return res.json({
      success: true,
      data: titles.filter(Boolean).sort((a, b) => a.localeCompare(b, "vi")),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getOrderById = async (req, res) => {
  try {
    const booking = await QuickBooking.findById(req.params.id)
      .populate("user", "fullName email phone")
      .lean();
    if (!booking) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn đặt vé" });
    }
    const [showtimeMap, posterMap] = await Promise.all([
      loadShowtimeMap([booking]),
      loadPosterMap([booking]),
    ]);
    return res.json({ success: true, data: mapOrder(booking, showtimeMap, posterMap) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateOrder = async (req, res) => {
  try {
    const booking = await QuickBooking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn đặt vé" });
    }

    const action = String(req.body.action || "").trim();
    if (action === "cancel") {
      if (booking.status === "cancelled" || booking.status === "refunded") {
        return res.status(409).json({ success: false, message: "Đơn đã bị hủy hoặc hoàn tiền" });
      }
      if (booking.status !== "paid") {
        return res.status(409).json({
          success: false,
          message: "Chỉ hủy được đơn đã thanh toán",
        });
      }
      if (booking.checkedIn) {
        return res.status(409).json({
          success: false,
          message: "Không thể hủy đơn đã check-in. Hãy xử lý hoàn tiền đặc biệt nếu cần.",
        });
      }
      const reason = String(req.body.reason || "").trim();
      if (reason.length < 5) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng nhập lý do hủy (tối thiểu 5 ký tự)",
        });
      }
      booking.status = "cancelled";
      booking.cancelReason = reason;
      booking.cancelledAt = new Date();
      booking.note = booking.note
        ? `${booking.note}\n[Hủy] ${reason}`
        : `[Hủy] ${reason}`;
    } else if (action === "refund") {
      if (booking.status !== "paid") {
        return res.status(409).json({ success: false, message: "Chỉ hoàn tiền đơn đã thanh toán" });
      }
      const reason = String(req.body.reason || "").trim();
      if (reason.length < 5) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng nhập lý do hoàn tiền (tối thiểu 5 ký tự)",
        });
      }
      booking.status = "refunded";
      booking.cancelledAt = new Date();
      booking.cancelReason = reason;
      booking.note = booking.note
        ? `${booking.note}\n[Hoàn tiền] ${reason}`
        : `[Hoàn tiền] ${reason}`;
    } else if (action === "checkin") {
      if (booking.status !== "paid") {
        return res.status(409).json({ success: false, message: "Chỉ check-in đơn đã thanh toán" });
      }
      booking.checkedIn = true;
      booking.checkedInAt = new Date();
    } else if (action === "note") {
      booking.note = String(req.body.note || "").trim();
    } else {
      return res.status(400).json({ success: false, message: "Hành động không hợp lệ" });
    }

    await booking.save();

    if (action === "cancel" || action === "refund") {
      await BookedSeat.deleteMany({ booking: booking._id });
      const userId = booking.user?._id || booking.user;
      if (userId) {
        const code = booking.code || `DH-${String(booking._id).slice(-6).toUpperCase()}`;
        const isCancel = action === "cancel";
        try {
          await createNotification({
            user: userId,
            type: "dat_ve",
            entityId: booking._id,
            action: "mo_ve",
            title: isCancel ? "Vé của bạn đã bị hủy" : "Vé của bạn đã được hoàn tiền",
            content: isCancel
              ? `Đơn ${code} · Phim ${booking.movieTitle} đã bị hủy. Lý do: ${booking.cancelReason}`
              : `Đơn ${code} · Phim ${booking.movieTitle} đã được hoàn tiền. Lý do: ${booking.cancelReason}`,
          });
        } catch (notifyError) {
          console.error("Không gửi được thông báo hủy/hoàn tiền:", notifyError);
        }
      }
    }

    await booking.populate("user", "fullName email phone");
    const plainBooking = booking.toObject();
    const [showtimeMap, posterMap] = await Promise.all([
      loadShowtimeMap([plainBooking]),
      loadPosterMap([plainBooking]),
    ]);
    return res.json({
      success: true,
      message: "Cập nhật đơn thành công",
      data: mapOrder(plainBooking, showtimeMap, posterMap),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  listOrders,
  getOrderMovies,
  getOrderById,
  updateOrder,
};
