const mongoose = require("mongoose");
const Ticket = require("../models/Ticket");
const QuickBooking = require("../models/QuickBooking");
const Showtime = require("../models/Showtime");
// Đăng ký các model được dùng gián tiếp bởi populate.
require("../models/Booking");
require("../models/User");
require("../models/Movie");
require("../models/Room");
require("../models/Seat");

const populateLegacyTickets = [
  {
    path: "booking",
    select: "ticketCode movieTitle roomName cinemaName totalPrice status paymentStatus paymentMethod user showtime createdAt updatedAt",
    populate: [
      { path: "user", select: "fullName email phone" },
      {
        path: "showtime",
        select: "movie room startTime endTime",
        populate: [
          { path: "movie", select: "title posterUrl" },
          { path: "room", select: "name type" },
        ],
      },
    ],
  },
  {
    path: "showtime",
    populate: [
      { path: "movie", select: "title posterUrl" },
      { path: "room", select: "name type" },
    ],
  },
  { path: "seat", populate: { path: "room", select: "name type" } },
];

const quickTicketStatus = (booking) => {
  if (["cancelled", "refunded"].includes(booking.status)) return "cancelled";
  return booking.checkedIn ? "used" : "valid";
};

const quickPaymentStatus = (status) => {
  if (status === "paid") return "paid";
  if (status === "refunded") return "refunded";
  return "unpaid";
};

const loadShowtimes = async (bookings) => {
  const ids = [...new Set(
    bookings
      .map((booking) => String(booking.showtimeId || "").trim())
      .filter((id) => mongoose.Types.ObjectId.isValid(id)),
  )];
  if (!ids.length) return new Map();

  const rows = await Showtime.find({ _id: { $in: ids } })
    .populate("movie", "title posterUrl")
    .populate("room", "name type")
    .lean();
  return new Map(rows.map((row) => [String(row._id), row]));
};

const expandQuickBooking = (booking, showtime) => {
  const seats = Array.isArray(booking.seats) ? booking.seats : [];
  const price = seats.length
    ? Number(booking.ticketTotal || booking.totalPrice || 0) / seats.length
    : 0;
  const bookingCode = booking.code || `DH-${String(booking._id).slice(-6).toUpperCase()}`;
  const customer = booking.user && typeof booking.user === "object" ? booking.user : null;

  return seats.map((seatLabel, index) => ({
    _id: `quick-${booking._id}-${index}`,
    code: `${bookingCode}-${seatLabel}`,
    price,
    status: quickTicketStatus(booking),
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
    seatLabel,
    source: "quickBooking",
    showtime: showtime || null,
    booking: {
      _id: booking._id,
      ticketCode: bookingCode,
      movieTitle: booking.movieTitle,
      roomName: showtime?.room?.name || "",
      totalPrice: booking.totalPrice,
      status: booking.status,
      paymentStatus: quickPaymentStatus(booking.status),
      paymentMethod: booking.paymentMethod,
      user: customer,
      showtime: showtime || null,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    },
  }));
};

const getAll = async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 500, 1), 500);

    const [legacyTickets, quickBookings] = await Promise.all([
      Ticket.find().populate(populateLegacyTickets).lean(),
      QuickBooking.find({ status: { $in: ["paid", "cancelled", "refunded"] } })
        .populate("user", "fullName email phone")
        .lean(),
    ]);
    const showtimeMap = await loadShowtimes(quickBookings);
    const quickTickets = quickBookings.flatMap((booking) =>
      expandQuickBooking(booking, showtimeMap.get(String(booking.showtimeId || ""))),
    );

    const data = [...legacyTickets, ...quickTickets]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);

    return res.json({
      success: true,
      message: "Lấy danh sách vé thành công",
      data,
      pagination: {
        page: 1,
        limit,
        total: legacyTickets.length + quickTickets.length,
        totalPages: Math.max(1, Math.ceil((legacyTickets.length + quickTickets.length) / limit)),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAll };
