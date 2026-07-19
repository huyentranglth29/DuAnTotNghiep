const Booking = require("../models/Booking");
const BookedSeat = require("../models/BookedSeat");
const Movie = require("../models/Movie");
const Notification = require("../models/Notification");
const Payment = require("../models/Payment");
const Product = require("../models/Product");
const QuickBooking = require("../models/QuickBooking");
const Room = require("../models/Room");
const Showtime = require("../models/Showtime");
const Ticket = require("../models/Ticket");
const User = require("../models/User");
const Voucher = require("../models/Voucher");

const VN_OFFSET = 7 * 60 * 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;

const vietnamDayStart = (date = new Date()) => {
  const shifted = new Date(date.getTime() + VN_OFFSET);
  return new Date(
    Date.UTC(
      shifted.getUTCFullYear(),
      shifted.getUTCMonth(),
      shifted.getUTCDate(),
    ) - VN_OFFSET,
  );
};

const dayKey = (date) => {
  const shifted = new Date(new Date(date).getTime() + VN_OFFSET);
  return [
    shifted.getUTCFullYear(),
    String(shifted.getUTCMonth() + 1).padStart(2, "0"),
    String(shifted.getUTCDate()).padStart(2, "0"),
  ].join("-");
};

const shortDate = (date) => {
  const shifted = new Date(new Date(date).getTime() + VN_OFFSET);
  return `${String(shifted.getUTCDate()).padStart(2, "0")}/${String(
    shifted.getUTCMonth() + 1,
  ).padStart(2, "0")}`;
};

const percentChange = (current, previous) => {
  if (!previous) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
};

const paidBookingFilter = {
  $or: [{ paymentStatus: "paid" }, { status: "paid" }],
};

const seatCount = (value) => {
  if (Array.isArray(value?.seats) && value.seats.length) return value.seats.length;
  return Array.isArray(value?.seatLabels) ? value.seatLabels.length : 0;
};

const getAdminOverview = async (req, res) => {
  try {
    const currentTime = new Date();
    const requestedDate = String(req.query.date || "").trim();
    let now = currentTime;
    if (/^\d{4}-\d{2}-\d{2}$/.test(requestedDate)) {
      const [year, month, date] = requestedDate.split("-").map(Number);
      const selectedNoon = new Date(
        Date.UTC(year, month - 1, date, 12) - VN_OFFSET,
      );
      if (!Number.isNaN(selectedNoon.getTime()) && dayKey(selectedNoon) !== dayKey(currentTime)) {
        now = selectedNoon;
      }
    }
    const todayStart = vietnamDayStart(now);
    const tomorrowStart = new Date(todayStart.getTime() + DAY);
    const yesterdayStart = new Date(todayStart.getTime() - DAY);
    const thirtyDayStart = new Date(todayStart.getTime() - 29 * DAY);

    const [
      quickBookings30,
      bookings30,
      recentQuickBookings,
      recentBookings,
      todayShowtimes,
      futureShowtimes,
      yesterdayShowtimeCount,
      todayTicketCount,
      yesterdayTicketCount,
      todayUserCount,
      yesterdayUserCount,
      nowShowingMovies,
      recentNotifications,
      recentPayments,
    ] = await Promise.all([
      QuickBooking.find({
        status: "paid",
        createdAt: { $gte: thirtyDayStart, $lt: tomorrowStart },
      })
        .populate("user", "fullName email")
        .lean(),
      Booking.find({
        ...paidBookingFilter,
        createdAt: { $gte: thirtyDayStart, $lt: tomorrowStart },
      })
        .populate("user", "fullName email")
        .populate({
          path: "showtime",
          populate: [
            { path: "movie", select: "title posterUrl poster" },
            { path: "room", select: "name totalSeats" },
          ],
        })
        .lean(),
      QuickBooking.find({ status: "paid" })
        .populate("user", "fullName email")
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
      Booking.find(paidBookingFilter)
        .populate("user", "fullName email")
        .populate({
          path: "showtime",
          populate: [
            { path: "movie", select: "title posterUrl poster" },
            { path: "room", select: "name totalSeats" },
          ],
        })
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
      Showtime.find({
        startTime: { $gte: todayStart, $lt: tomorrowStart },
        status: { $ne: "cancelled" },
      })
        .populate("movie", "title posterUrl poster duration status")
        .populate("room", "name totalSeats status")
        .sort({ startTime: 1 })
        .lean(),
      Showtime.find({
        startTime: { $gt: now, $lt: tomorrowStart },
        status: "scheduled",
      })
        .populate("movie", "title posterUrl poster duration status")
        .populate("room", "name totalSeats status")
        .sort({ startTime: 1 })
        .limit(4)
        .lean(),
      Showtime.countDocuments({
        startTime: { $gte: yesterdayStart, $lt: todayStart },
        status: { $ne: "cancelled" },
      }),
      Ticket.countDocuments({
        status: { $in: ["valid", "used"] },
        createdAt: { $gte: todayStart, $lt: tomorrowStart },
      }),
      Ticket.countDocuments({
        status: { $in: ["valid", "used"] },
        createdAt: { $gte: yesterdayStart, $lt: todayStart },
      }),
      User.countDocuments({ createdAt: { $gte: todayStart, $lt: tomorrowStart } }),
      User.countDocuments({ createdAt: { $gte: yesterdayStart, $lt: todayStart } }),
      Movie.countDocuments({
        status: { $in: ["now_showing", "now-showing", "featured"] },
      }),
      Notification.find()
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
      Payment.find()
        .populate("user", "fullName email")
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
    ]);

    const todayQuick = quickBookings30.filter(
      (item) => item.createdAt >= todayStart && item.createdAt < tomorrowStart,
    );
    const yesterdayQuick = quickBookings30.filter(
      (item) => item.createdAt >= yesterdayStart && item.createdAt < todayStart,
    );
    const todayBookings = bookings30.filter(
      (item) => item.createdAt >= todayStart && item.createdAt < tomorrowStart,
    );
    const yesterdayBookings = bookings30.filter(
      (item) => item.createdAt >= yesterdayStart && item.createdAt < todayStart,
    );

    const sumRevenue = (items) =>
      items.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0);
    const todayRevenue = sumRevenue(todayQuick) + sumRevenue(todayBookings);
    const yesterdayRevenue =
      sumRevenue(yesterdayQuick) + sumRevenue(yesterdayBookings);
    const todayTickets =
      todayTicketCount +
      todayQuick.reduce((sum, item) => sum + seatCount(item), 0);
    const yesterdayTickets =
      yesterdayTicketCount +
      yesterdayQuick.reduce((sum, item) => sum + seatCount(item), 0);

    const dashboardShowtimes = [
      ...todayShowtimes,
      ...futureShowtimes.filter(
        (future) =>
          !todayShowtimes.some(
            (current) => String(current._id) === String(future._id),
          ),
      ),
    ];
    const showtimeIds = dashboardShowtimes.map((item) => String(item._id));
    const showtimeObjectIds = dashboardShowtimes.map((item) => item._id);
    const [quickSeatRows, standardTicketRows] = await Promise.all([
      showtimeIds.length
        ? BookedSeat.aggregate([
            {
              $match: {
                showtimeId: { $in: showtimeIds },
                booking: { $exists: true, $ne: null },
              },
            },
            { $group: { _id: "$showtimeId", sold: { $sum: 1 } } },
          ])
        : [],
      showtimeObjectIds.length
        ? Ticket.aggregate([
            {
              $match: {
                showtime: { $in: showtimeObjectIds },
                status: { $in: ["valid", "used"] },
              },
            },
            { $group: { _id: "$showtime", sold: { $sum: 1 } } },
          ])
        : [],
    ]);

    const soldByShowtime = new Map();
    quickSeatRows.forEach((row) => soldByShowtime.set(String(row._id), row.sold));
    standardTicketRows.forEach((row) => {
      const key = String(row._id);
      soldByShowtime.set(key, (soldByShowtime.get(key) || 0) + row.sold);
    });

    const formatShowtime = (showtime) => {
      const totalSeats = Number(showtime.room?.totalSeats || 0);
      const soldSeats = soldByShowtime.get(String(showtime._id)) || 0;
      return {
        id: showtime._id,
        movieTitle: showtime.movie?.title || "Phim chưa xác định",
        poster: showtime.movie?.posterUrl || showtime.movie?.poster || "",
        room: showtime.room?.name || "Phòng chưa xác định",
        startTime: showtime.startTime,
        endTime: showtime.endTime,
        soldSeats,
        totalSeats,
        occupancyRate: totalSeats
          ? Math.min(100, Math.round((soldSeats / totalSeats) * 100))
          : 0,
      };
    };

    const formattedShowtimes = todayShowtimes.map(formatShowtime);
    const playingShowtimes = formattedShowtimes
      .filter(
        (item) =>
          new Date(item.startTime) <= now && new Date(item.endTime) > now,
      )
      .slice(0, 3);
    const upcomingShowtimes = futureShowtimes.map(formatShowtime).slice(0, 4);

    const roomMap = new Map();
    formattedShowtimes.forEach((item) => {
      const current = roomMap.get(item.room) || {
        name: item.room,
        soldSeats: 0,
        capacity: 0,
      };
      current.soldSeats += item.soldSeats;
      current.capacity += item.totalSeats;
      roomMap.set(item.room, current);
    });
    const roomOccupancy = [...roomMap.values()]
      .map((room) => ({
        ...room,
        occupancyRate: room.capacity
          ? Math.min(100, Math.round((room.soldSeats / room.capacity) * 100))
          : 0,
      }))
      .sort((a, b) => b.occupancyRate - a.occupancyRate);

    const occupancyBands = [
      { label: "0 – 25%", min: 0, max: 25, tone: "green" },
      { label: "25 – 50%", min: 25, max: 50, tone: "blue" },
      { label: "50 – 75%", min: 50, max: 75, tone: "orange" },
      { label: "75 – 100%", min: 75, max: 101, tone: "red" },
    ].map((band) => {
      const count = roomOccupancy.filter(
        (room) =>
          room.occupancyRate >= band.min && room.occupancyRate < band.max,
      ).length;
      return {
        label: band.label,
        count,
        percentage: roomOccupancy.length
          ? Math.round((count / roomOccupancy.length) * 100)
          : 0,
        tone: band.tone,
      };
    });
    const averageOccupancy = roomOccupancy.length
      ? Math.round(
          roomOccupancy.reduce((sum, room) => sum + room.occupancyRate, 0) /
            roomOccupancy.length,
        )
      : 0;

    const revenueMap = new Map();
    for (let index = 0; index < 30; index += 1) {
      const date = new Date(thirtyDayStart.getTime() + index * DAY);
      revenueMap.set(dayKey(date), {
        date: dayKey(date),
        label: shortDate(date),
        revenue: 0,
      });
    }
    [...quickBookings30, ...bookings30].forEach((item) => {
      const row = revenueMap.get(dayKey(item.createdAt));
      if (row) row.revenue += Number(item.totalPrice || 0);
    });

    const movieMap = new Map();
    const addMovieRevenue = (title, revenue, tickets) => {
      const safeTitle = title || "Phim chưa xác định";
      const current = movieMap.get(safeTitle) || {
        title: safeTitle,
        revenue: 0,
        tickets: 0,
      };
      current.revenue += Number(revenue || 0);
      current.tickets += Number(tickets || 0);
      movieMap.set(safeTitle, current);
    };
    quickBookings30.forEach((item) =>
      addMovieRevenue(item.movieTitle, item.totalPrice, seatCount(item)),
    );
    bookings30.forEach((item) =>
      addMovieRevenue(
        item.movieTitle || item.showtime?.movie?.title,
        item.totalPrice,
        seatCount(item),
      ),
    );
    const topMovies = [...movieMap.values()]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const comboMap = new Map();
    quickBookings30.forEach((booking) => {
      (booking.combos || []).forEach((combo) => {
        const name = combo.name || "Combo";
        const current = comboMap.get(name) || { name, quantity: 0, revenue: 0 };
        current.quantity += Number(combo.quantity || 0);
        current.revenue += Number(combo.totalPrice || 0);
        comboMap.set(name, current);
      });
    });
    const topCombos = [...comboMap.values()]
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    const normalizeQuickOrder = (item) => ({
      id: item._id,
      createdAt: item.createdAt,
      customer: item.user?.fullName || item.user?.email || "Khách FilmGo",
      movieTitle: item.movieTitle || "Phim chưa xác định",
      ticketCount: seatCount(item),
      totalPrice: Number(item.totalPrice || 0),
      source: "quickBooking",
    });
    const normalizeBooking = (item) => ({
      id: item._id,
      createdAt: item.createdAt,
      customer: item.user?.fullName || item.user?.email || "Khách FilmGo",
      movieTitle:
        item.movieTitle ||
        item.showtime?.movie?.title ||
        "Phim chưa xác định",
      ticketCount: seatCount(item),
      totalPrice: Number(item.totalPrice || 0),
      source: "booking",
    });
    const recentOrders = [
      ...recentQuickBookings.map(normalizeQuickOrder),
      ...recentBookings.map(normalizeBooking),
    ]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    const activities = [
      ...recentOrders.map((order) => ({
        id: `order-${order.id}`,
        createdAt: order.createdAt,
        type: "booking",
        text: `${order.customer} đặt ${order.ticketCount} vé phim ${order.movieTitle}`,
      })),
      ...recentPayments.map((payment) => ({
        id: `payment-${payment._id}`,
        createdAt: payment.updatedAt,
        type: "payment",
        text: `Giao dịch ${payment.orderCode}: ${
          payment.status === "da_thanh_toan"
            ? "đã thanh toán"
            : payment.status.replaceAll("_", " ")
        }`,
      })),
      ...recentNotifications.slice(0, 4).map((notification) => ({
        id: `notification-${notification._id}`,
        createdAt: notification.createdAt,
        type: "notification",
        text: notification.title || notification.content,
      })),
    ]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6);

    return res.json({
      success: true,
      data: {
        generatedAt: now,
        metrics: {
          revenue: {
            value: todayRevenue,
            change: percentChange(todayRevenue, yesterdayRevenue),
          },
          tickets: {
            value: todayTickets,
            change: percentChange(todayTickets, yesterdayTickets),
          },
          showtimes: {
            value: todayShowtimes.length,
            change: todayShowtimes.length - yesterdayShowtimeCount,
          },
          movies: { value: nowShowingMovies, change: null },
          users: {
            value: todayUserCount,
            change: percentChange(todayUserCount, yesterdayUserCount),
          },
        },
        revenueByDay: [...revenueMap.values()],
        occupancy: {
          average: averageOccupancy,
          distribution: occupancyBands,
          rooms: roomOccupancy.slice(0, 5),
        },
        playingShowtimes,
        upcomingShowtimes,
        topMovies,
        topCombos,
        recentOrders,
        activities,
        notifications: recentNotifications.slice(0, 4).map((item) => ({
          id: item._id,
          title: item.title,
          content: item.content,
          type: item.type,
          createdAt: item.createdAt,
        })),
        todaySchedule: formattedShowtimes,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getDashboard = async (req, res) => {
  try {
    const [
      totalMovies,
      totalUsers,
      totalRooms,
      totalShowtimes,
      totalTickets,
      totalBookings,
      totalProducts,
      totalVouchers,
      paidBookings,
      paidQuickBookings,
      paidTickets,
      quickTicketRows,
      recentBookings,
      recentUsers,
      recentMovies,
    ] = await Promise.all([
      Movie.countDocuments(),
      User.countDocuments(),
      Room.countDocuments(),
      Showtime.countDocuments(),
      Ticket.countDocuments(),
      Booking.countDocuments(),
      Product.countDocuments(),
      Voucher.countDocuments(),
      Booking.aggregate([
        { $match: { $or: [{ paymentStatus: "paid" }, { status: "paid" }] } },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } },
      ]),
      QuickBooking.aggregate([
        { $match: { status: "paid" } },
        {
          $group: {
            _id: null,
            total: { $sum: "$totalPrice" },
            bookings: { $sum: 1 },
          },
        },
      ]),
      Ticket.aggregate([
        { $match: { status: { $in: ["valid", "used"] } } },
        { $group: { _id: null, total: { $sum: "$price" } } },
      ]),
      QuickBooking.aggregate([
        { $match: { status: "paid" } },
        { $project: { ticketCount: { $size: { $ifNull: ["$seats", []] } } } },
        { $group: { _id: null, total: { $sum: "$ticketCount" } } },
      ]),
      Booking.find()
        .populate("user", "fullName email role status")
        .populate("showtime")
        .sort({ createdAt: -1 })
        .limit(5),
      User.find().select("-password").sort({ createdAt: -1 }).limit(5),
      Movie.find().sort({ createdAt: -1 }).limit(5),
    ]);

    const bookingRevenue = paidBookings[0]?.total || 0;
    const quickBookingRevenue = paidQuickBookings[0]?.total || 0;
    const quickBookingCount = paidQuickBookings[0]?.bookings || 0;
    const ticketRevenue = paidTickets[0]?.total || 0;
    const quickTicketCount = quickTicketRows[0]?.total || 0;

    return res.json({
      success: true,
      data: {
        totalMovies,
        totalUsers,
        totalRooms,
        totalShowtimes,
        totalTickets: totalTickets + quickTicketCount,
        totalBookings: totalBookings + quickBookingCount,
        totalProducts,
        totalVouchers,
        totalRevenue: bookingRevenue + quickBookingRevenue || ticketRevenue,
        recentBookings,
        recentUsers,
        recentMovies,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getDashboard,
  getAdminOverview,
};
