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

const quickTicketStatus = (booking, seatLabel) => {
  if (["cancelled", "refunded"].includes(booking.status)) return "cancelled";
  const checkedSeats = Array.isArray(booking.checkedInSeats) ? booking.checkedInSeats : [];
  if (checkedSeats.includes(seatLabel)) return "used";
  // Tương thích dữ liệu cũ: checkedIn=true trước khi có check-in theo từng ghế.
  if (booking.checkedIn && checkedSeats.length === 0) return "used";
  return "valid";
};

const quickPaymentStatus = (status) => {
  if (status === "paid") return "paid";
  if (status === "refunded") return "refunded";
  return "unpaid";
};

const normalizeLegacyTicket = (ticket) => {
  const booking = ticket.booking ? { ...ticket.booking } : {};
  // Một vé đã phát hành còn hiệu lực/đã dùng bắt buộc phải được thanh toán.
  if (["valid", "used"].includes(ticket.status)) booking.paymentStatus = "paid";
  if (ticket.status === "cancelled" && booking.paymentStatus === "paid") {
    booking.paymentStatus = "refunded";
  }

  return {
    ...ticket,
    paymentStatus: booking.paymentStatus || "unpaid",
    cinemaName: booking.cinemaName || "FilmGo Hà Trung (Thanh Hóa)",
    roomName: ticket.showtime?.room?.name || booking.roomName || "",
    orderCode: booking.ticketCode || String(booking._id || ""),
    bookedAt: booking.createdAt || ticket.createdAt,
    combos: booking.combos || [],
    qrValue: ticket.code,
    booking,
  };
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
    status: quickTicketStatus(booking, seatLabel),
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
    paymentStatus: quickPaymentStatus(booking.status),
    cinemaName: booking.cinema || "FilmGo Hà Trung (Thanh Hóa)",
    roomName: showtime?.room?.name || "",
    orderCode: bookingCode,
    bookedAt: booking.createdAt,
    bookingDate: booking.bookingDate || "",
    bookingTime: booking.bookingTime || "",
    combos: booking.combos || [],
    qrValue: `${bookingCode}-${seatLabel}`,
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
      cinemaName: booking.cinema || "FilmGo Hà Trung (Thanh Hóa)",
      bookingDate: booking.bookingDate || "",
      bookingTime: booking.bookingTime || "",
      combos: booking.combos || [],
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

    const keyword = String(req.query.keyword || "").trim().toLocaleLowerCase("vi");
    const allTickets = [...legacyTickets.map(normalizeLegacyTicket), ...quickTickets]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const filteredTickets = keyword
      ? allTickets.filter((ticket) => [
        ticket.code,
        ticket.orderCode,
        ticket.booking?.movieTitle,
        ticket.booking?.user?.fullName,
        ticket.booking?.user?.email,
        ticket.seatLabel,
        ticket.seat?.row && ticket.seat?.number
          ? `${ticket.seat.row}${ticket.seat.number}`
          : "",
      ].filter(Boolean).join(" ").toLocaleLowerCase("vi").includes(keyword))
      : allTickets;
    const data = filteredTickets.slice(0, limit);

    return res.json({
      success: true,
      message: "Lấy danh sách vé thành công",
      data,
      pagination: {
        page: 1,
        limit,
        total: filteredTickets.length,
        totalPages: Math.max(1, Math.ceil(filteredTickets.length / limit)),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const id = String(req.params.id || "");
    const quickMatch = id.match(/^quick-([a-f\d]{24})-\d+$/i);

    if (quickMatch) {
      const booking = await QuickBooking.findById(quickMatch[1]);
      if (!booking) return res.status(404).json({ success: false, message: "Không tìm thấy đơn vé" });
      if (booking.status !== "paid") {
        return res.status(409).json({ success: false, message: "Chỉ check-in vé đã thanh toán" });
      }
      const seatIndex = Number(id.slice(id.lastIndexOf("-") + 1));
      const seatLabel = booking.seats?.[seatIndex];
      if (!seatLabel) {
        return res.status(404).json({ success: false, message: "Không tìm thấy ghế của vé" });
      }
      const checkedSeats = new Set(booking.checkedInSeats || []);
      if (checkedSeats.has(seatLabel)) {
        return res.status(409).json({ success: false, message: `Vé ghế ${seatLabel} đã được sử dụng` });
      }
      checkedSeats.add(seatLabel);
      booking.checkedInSeats = [...checkedSeats];
      booking.checkedIn = booking.seats.every((seat) => checkedSeats.has(seat));
      booking.checkedInAt = new Date();
      await booking.save();
      return res.json({
        success: true,
        message: `Check-in vé ghế ${seatLabel} thành công`,
        data: { seatLabel, checkedInSeats: booking.checkedInSeats, checkedIn: booking.checkedIn },
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "ID vé không hợp lệ" });
    }
    const ticket = await Ticket.findById(id).populate("booking");
    if (!ticket) return res.status(404).json({ success: false, message: "Không tìm thấy vé" });
    if (ticket.status === "cancelled") {
      return res.status(409).json({ success: false, message: "Không thể check-in vé đã hủy" });
    }
    if (ticket.booking?.paymentStatus !== "paid") {
      return res.status(409).json({ success: false, message: "Chỉ check-in vé đã thanh toán" });
    }
    ticket.status = "used";
    await ticket.save();
    return res.json({ success: true, message: "Check-in vé thành công", data: ticket });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAll, update };
