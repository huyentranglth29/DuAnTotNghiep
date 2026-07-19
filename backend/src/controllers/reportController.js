const mongoose = require("mongoose");
const BookedSeat = require("../models/BookedSeat");
const Booking = require("../models/Booking");
const Movie = require("../models/Movie");
const Room = require("../models/Room");
const Seat = require("../models/Seat");
const Showtime = require("../models/Showtime");
const Ticket = require("../models/Ticket");
const QuickBooking = require("../models/QuickBooking");

const paidBookingMatch = {
  $or: [{ paymentStatus: "paid" }, { status: "paid" }],
};

const paidQuickBookingMatch = {
  status: "paid",
};

const ok = (res, data) => res.json({ success: true, data });

const fail = (res, error) =>
  res.status(500).json({ success: false, message: error.message });

const getRange = (req) => {
  const to = req.query.to ? new Date(req.query.to) : new Date();
  const from = req.query.from ? new Date(req.query.from) : new Date(to);

  if (!req.query.from) {
    from.setDate(from.getDate() - 6);
  }

  from.setHours(0, 0, 0, 0);
  to.setHours(23, 59, 59, 999);

  return { from, to };
};

const isObjectId = (value) => mongoose.Types.ObjectId.isValid(String(value));

const toObjectId = (value) => new mongoose.Types.ObjectId(String(value));

const seatCount = (booking) => {
  if (Array.isArray(booking?.seats)) return booking.seats.length;
  if (Array.isArray(booking?.seatLabels)) return booking.seatLabels.length;
  return 0;
};

const addNumber = (map, key, value) => {
  map.set(key, (map.get(key) || 0) + Number(value || 0));
};

const revenueByDay = async (req, res) => {
  try {
    const { from, to } = getRange(req);
    const [bookings, quickBookings] = await Promise.all([
      Booking.aggregate([
        { $match: { ...paidBookingMatch, createdAt: { $gte: from, $lte: to } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            revenue: { $sum: "$totalPrice" },
            bookings: { $sum: 1 },
          },
        },
      ]),
      QuickBooking.aggregate([
        { $match: { ...paidQuickBookingMatch, createdAt: { $gte: from, $lte: to } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            revenue: { $sum: "$totalPrice" },
            bookings: { $sum: 1 },
          },
        },
      ]),
    ]);

    const dayMap = new Map();
    [...bookings, ...quickBookings].forEach((item) => {
      const current = dayMap.get(item._id) || {
        date: item._id,
        revenue: 0,
        bookings: 0,
      };
      current.revenue += Number(item.revenue || 0);
      current.bookings += Number(item.bookings || 0);
      dayMap.set(item._id, current);
    });
    const data = [...dayMap.values()].sort((a, b) => a.date.localeCompare(b.date));

    return ok(res, data);
  } catch (error) {
    return fail(res, error);
  }
};

const revenueByMovie = async (req, res) => {
  try {
    const [bookings, quickBookings] = await Promise.all([
      Booking.aggregate([
        { $match: paidBookingMatch },
        {
          $lookup: {
            from: Showtime.collection.name,
            localField: "showtime",
            foreignField: "_id",
            as: "showtime",
          },
        },
        { $unwind: { path: "$showtime", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: Movie.collection.name,
            localField: "showtime.movie",
            foreignField: "_id",
            as: "movie",
          },
        },
        { $unwind: { path: "$movie", preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: { $ifNull: ["$showtime.movie", "$movieTitle"] },
            title: { $first: { $ifNull: ["$movie.title", "$movieTitle"] } },
            revenue: { $sum: "$totalPrice" },
            bookings: { $sum: 1 },
          },
        },
      ]),
      QuickBooking.aggregate([
        { $match: paidQuickBookingMatch },
        {
          $group: {
            _id: "$movieTitle",
            title: { $first: "$movieTitle" },
            revenue: { $sum: "$totalPrice" },
            bookings: { $sum: 1 },
          },
        },
      ]),
    ]);

    const movieMap = new Map();
    [...bookings, ...quickBookings].forEach((item) => {
      const title = item.title || "Phim chưa xác định";
      const current = movieMap.get(title) || {
        movieId: isObjectId(item._id) ? item._id : undefined,
        title,
        revenue: 0,
        bookings: 0,
      };
      current.revenue += Number(item.revenue || 0);
      current.bookings += Number(item.bookings || 0);
      movieMap.set(title, current);
    });
    const data = [...movieMap.values()].sort((a, b) => b.revenue - a.revenue);

    return ok(res, data);
  } catch (error) {
    return fail(res, error);
  }
};

const revenueByRoom = async (req, res) => {
  try {
    const [bookings, quickBookings] = await Promise.all([
      Booking.find(paidBookingMatch)
        .populate({
          path: "showtime",
          populate: { path: "room", select: "name type" },
        })
        .lean(),
      QuickBooking.find(paidQuickBookingMatch).lean(),
    ]);

    const quickShowtimeIds = [
      ...new Set(
        quickBookings
          .map((item) => item.showtimeId)
          .filter(isObjectId)
          .map(String),
      ),
    ];
    const quickShowtimes = quickShowtimeIds.length
      ? await Showtime.find({ _id: { $in: quickShowtimeIds.map(toObjectId) } })
          .populate("room", "name type")
          .lean()
      : [];
    const showtimeMap = new Map(
      quickShowtimes.map((showtime) => [String(showtime._id), showtime]),
    );
    const roomMap = new Map();

    const addRoom = (room, fallbackName, revenue) => {
      const name = room?.name || fallbackName || "Phòng chưa xác định";
      const current = roomMap.get(name) || {
        roomId: room?._id,
        name,
        type: room?.type || "",
        revenue: 0,
        bookings: 0,
      };
      current.revenue += Number(revenue || 0);
      current.bookings += 1;
      roomMap.set(name, current);
    };

    bookings.forEach((booking) =>
      addRoom(booking.showtime?.room, booking.roomName, booking.totalPrice),
    );
    quickBookings.forEach((booking) =>
      addRoom(showtimeMap.get(String(booking.showtimeId))?.room, "", booking.totalPrice),
    );

    const data = [...roomMap.values()].sort((a, b) => b.revenue - a.revenue);

    return ok(res, data);
  } catch (error) {
    return fail(res, error);
  }
};

const ticketsByDay = async (req, res) => {
  try {
    const { from, to } = getRange(req);
    const [ticketRows, quickRows] = await Promise.all([
      Ticket.aggregate([
        { $match: { createdAt: { $gte: from, $lte: to } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            tickets: { $sum: 1 },
            used: { $sum: { $cond: [{ $eq: ["$status", "used"] }, 1, 0] } },
            cancelled: { $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] } },
          },
        },
      ]),
      QuickBooking.find({
        ...paidQuickBookingMatch,
        createdAt: { $gte: from, $lte: to },
      })
        .select("seats createdAt checkedIn")
        .lean(),
    ]);

    const dayMap = new Map();
    ticketRows.forEach((item) => {
      dayMap.set(item._id, {
        date: item._id,
        tickets: Number(item.tickets || 0),
        used: Number(item.used || 0),
        cancelled: Number(item.cancelled || 0),
      });
    });
    quickRows.forEach((booking) => {
      const date = booking.createdAt.toISOString().slice(0, 10);
      const current = dayMap.get(date) || {
        date,
        tickets: 0,
        used: 0,
        cancelled: 0,
      };
      const count = seatCount(booking);
      current.tickets += count;
      if (booking.checkedIn) current.used += count;
      dayMap.set(date, current);
    });

    const data = [...dayMap.values()].sort((a, b) => a.date.localeCompare(b.date));

    return ok(res, data);
  } catch (error) {
    return fail(res, error);
  }
};

const seatOccupancy = async (req, res) => {
  try {
    const showtimeId = req.query.showtime;
    const match = showtimeId && mongoose.Types.ObjectId.isValid(showtimeId)
      ? { _id: new mongoose.Types.ObjectId(showtimeId) }
      : {};

    const showtimes = await Showtime.find(match).populate("room", "name totalSeats").lean();
    const showtimeIds = showtimes.map((showtime) => showtime._id);
    const showtimeIdStrings = showtimeIds.map(String);
    const [ticketRows, bookedSeatRows, seatRows] = await Promise.all([
      showtimeIds.length
        ? Ticket.aggregate([
            {
              $match: {
                showtime: { $in: showtimeIds },
                status: { $in: ["valid", "used"] },
              },
            },
            { $group: { _id: "$showtime", sold: { $sum: 1 } } },
          ])
        : [],
      showtimeIdStrings.length
        ? BookedSeat.aggregate([
            {
              $match: {
                showtimeId: { $in: showtimeIdStrings },
                booking: { $exists: true, $ne: null },
              },
            },
            { $group: { _id: "$showtimeId", sold: { $sum: 1 } } },
          ])
        : [],
      Seat.aggregate([
        { $group: { _id: "$room", totalSeats: { $sum: 1 } } },
      ]),
    ]);

    const soldByShowtime = new Map();
    ticketRows.forEach((row) => addNumber(soldByShowtime, String(row._id), row.sold));
    bookedSeatRows.forEach((row) => addNumber(soldByShowtime, String(row._id), row.sold));
    const seatsByRoom = new Map(
      seatRows.map((row) => [String(row._id), Number(row.totalSeats || 0)]),
    );
    const roomMap = new Map();

    showtimes.forEach((showtime) => {
      const roomId = String(showtime.room?._id || "");
      const roomName = showtime.room?.name || "Phòng chưa xác định";
      const totalSeats =
        Number(showtime.room?.totalSeats || 0) || seatsByRoom.get(roomId) || 0;
      const soldTickets = soldByShowtime.get(String(showtime._id)) || 0;
      const current = roomMap.get(roomName) || {
        roomId: showtime.room?._id,
        room: roomName,
        totalSeats: 0,
        soldTickets: 0,
        showtimes: 0,
      };
      current.totalSeats += totalSeats;
      current.soldTickets += soldTickets;
      current.showtimes += 1;
      roomMap.set(roomName, current);
    });

    const data = [...roomMap.values()]
      .map((room) => ({
        ...room,
        occupancyRate: room.totalSeats
          ? Math.round((room.soldTickets / room.totalSeats) * 1000) / 10
          : 0,
      }))
      .sort((a, b) => b.occupancyRate - a.occupancyRate);

    return ok(res, data);
  } catch (error) {
    return fail(res, error);
  }
};

const topMovies = async (req, res) => {
  try {
    const limit = Math.max(Number(req.query.limit) || 5, 1);
    const [bookings, quickBookings] = await Promise.all([
      Booking.find(paidBookingMatch)
        .populate({ path: "showtime", populate: { path: "movie", select: "title" } })
        .select("showtime movieTitle totalPrice seats seatLabels")
        .lean(),
      QuickBooking.find(paidQuickBookingMatch)
        .select("movieTitle totalPrice seats")
        .lean(),
    ]);

    const movieMap = new Map();
    const addMovie = (title, revenue, tickets) => {
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

    bookings.forEach((booking) =>
      addMovie(
        booking.showtime?.movie?.title || booking.movieTitle,
        booking.totalPrice,
        seatCount(booking),
      ),
    );
    quickBookings.forEach((booking) =>
      addMovie(booking.movieTitle, booking.totalPrice, seatCount(booking)),
    );

    const data = [...movieMap.values()]
      .sort((a, b) => b.revenue - a.revenue || b.tickets - a.tickets)
      .slice(0, limit);

    return ok(res, data);
  } catch (error) {
    return fail(res, error);
  }
};

const normalizeGenre = (genre) => {
  if (Array.isArray(genre)) {
    return genre.map((item) => String(item || "").trim()).filter(Boolean);
  }
  if (typeof genre === "string" && genre.trim()) {
    return genre
      .split(/[,/|]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return ["Khác"];
};

const voucherStats = async (req, res) => {
  try {
    const to = req.query.to ? new Date(req.query.to) : new Date();
    const from = req.query.from ? new Date(req.query.from) : new Date(to);

    if (!req.query.from) {
      from.setDate(from.getDate() - 29);
    }

    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);

    const voucherBookingMatch = {
      voucher: { $ne: null, $exists: true },
      status: { $ne: "cancelled" },
      createdAt: { $gte: from, $lte: to },
    };

    const Voucher = require("../models/Voucher");

    const [usageTrend, usedByType, genreRaw, usageByVoucher, vouchers] =
      await Promise.all([
        Booking.aggregate([
          { $match: voucherBookingMatch },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
          { $project: { _id: 0, date: "$_id", count: 1 } },
        ]),
        Booking.aggregate([
          { $match: voucherBookingMatch },
          {
            $lookup: {
              from: Voucher.collection.name,
              localField: "voucher",
              foreignField: "_id",
              as: "voucherDoc",
            },
          },
          { $unwind: "$voucherDoc" },
          {
            $group: {
              _id: "$voucherDoc.discountType",
              count: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              discountType: "$_id",
              count: 1,
            },
          },
        ]),
        Booking.aggregate([
          { $match: voucherBookingMatch },
          {
            $lookup: {
              from: Showtime.collection.name,
              localField: "showtime",
              foreignField: "_id",
              as: "showtime",
            },
          },
          { $unwind: "$showtime" },
          {
            $lookup: {
              from: Movie.collection.name,
              localField: "showtime.movie",
              foreignField: "_id",
              as: "movie",
            },
          },
          { $unwind: "$movie" },
          {
            $project: {
              genre: "$movie.genre",
            },
          },
        ]),
        Booking.aggregate([
          {
            $match: {
              voucher: { $ne: null, $exists: true },
              status: { $ne: "cancelled" },
            },
          },
          {
            $group: {
              _id: "$voucher",
              usedCount: { $sum: 1 },
            },
          },
        ]),
        Voucher.find().sort({ createdAt: -1 }).lean(),
      ]);

    const quickMatch = {voucher: {$ne: null, $exists: true}, status: "paid", createdAt: {$gte: from, $lte: to}};
    const [quickTrend, quickTypes, quickGenres, quickUsage] = await Promise.all([
      QuickBooking.aggregate([{$match: quickMatch}, {$group: {_id: {$dateToString: {format: "%Y-%m-%d", date: "$createdAt"}}, count: {$sum: 1}}}]),
      QuickBooking.aggregate([{$match: quickMatch}, {$lookup: {from: Voucher.collection.name, localField: "voucher", foreignField: "_id", as: "voucherDoc"}}, {$unwind: "$voucherDoc"}, {$group: {_id: "$voucherDoc.discountType", count: {$sum: 1}}}, {$project: {_id: 0, discountType: "$_id", count: 1}}]),
      QuickBooking.find(quickMatch).select("movieGenre -_id").lean(),
      QuickBooking.aggregate([{$match: {voucher: {$ne: null, $exists: true}, status: "paid"}}, {$group: {_id: "$voucher", usedCount: {$sum: 1}}}]),
    ]);
    quickTrend.forEach(row => {
      const date = row._id;
      const found = usageTrend.find(item => item.date === date);
      if (found) found.count += row.count; else usageTrend.push({date, count: row.count});
    });
    quickTypes.forEach(row => {
      const found = usedByType.find(item => item.discountType === row.discountType);
      if (found) found.count += row.count; else usedByType.push(row);
    });
    quickGenres.forEach(row => genreRaw.push({genre: row.movieGenre}));
    quickUsage.forEach(row => {
      const found = usageByVoucher.find(item => String(item._id) === String(row._id));
      if (found) found.usedCount += row.usedCount; else usageByVoucher.push(row);
    });

    const genreCounts = {};
    genreRaw.forEach((row) => {
      normalizeGenre(row.genre).forEach((genre) => {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      });
    });

    const genreTotal = Object.values(genreCounts).reduce((sum, n) => sum + n, 0);
    const usageByGenre = Object.entries(genreCounts)
      .map(([genre, count]) => ({
        genre,
        count,
        percent: genreTotal ? Math.round((count / genreTotal) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const typeTotal = usedByType.reduce((sum, row) => sum + row.count, 0);
    const typeDistribution = ["percent", "amount"].map((discountType) => {
      const found = usedByType.find((row) => row.discountType === discountType);
      const count = found?.count || 0;
      return {
        discountType,
        label: discountType === "percent" ? "Giảm %" : "Giảm số tiền",
        count,
        percent: typeTotal ? Math.round((count / typeTotal) * 100) : 0,
      };
    });

    const usageMap = Object.fromEntries(
      usageByVoucher.map((row) => [String(row._id), row.usedCount])
    );

    const voucherUsage = vouchers.map((voucher) => {
      const usedCount = usageMap[String(voucher._id)] || 0;
      const quantity = Number(voucher.quantity || 0);
      const percent =
        quantity > 0 ? Math.min(100, Math.round((usedCount / quantity) * 100)) : 0;

      return {
        ...voucher,
        usedCount,
        usagePercent: percent,
      };
    });

    const dayMap = Object.fromEntries(
      usageTrend.map((row) => [row.date, row.count])
    );
    const filledTrend = [];
    const cursor = new Date(from);
    while (cursor <= to) {
      const key = cursor.toISOString().slice(0, 10);
      filledTrend.push({ date: key, count: dayMap[key] || 0 });
      cursor.setDate(cursor.getDate() + 1);
    }

    return ok(res, {
      from: from.toISOString(),
      to: to.toISOString(),
      usageTrend: filledTrend,
      typeDistribution,
      usageByGenre,
      topVouchers: voucherUsage
        .slice()
        .sort((a, b) => b.usedCount - a.usedCount)
        .slice(0, 4),
      vouchers: voucherUsage,
      totalUsages: usageTrend.reduce((sum, row) => sum + row.count, 0),
    });
  } catch (error) {
    return fail(res, error);
  }
};

module.exports = {
  revenueByDay,
  revenueByMovie,
  revenueByRoom,
  ticketsByDay,
  seatOccupancy,
  topMovies,
  voucherStats,
};
