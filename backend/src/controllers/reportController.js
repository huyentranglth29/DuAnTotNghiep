const mongoose = require("mongoose");
const BookedSeat = require("../models/BookedSeat");
const Booking = require("../models/Booking");
const Movie = require("../models/Movie");
const Room = require("../models/Room");
const Seat = require("../models/Seat");
const Showtime = require("../models/Showtime");
const Ticket = require("../models/Ticket");
const QuickBooking = require("../models/QuickBooking");
const Review = require("../models/Review");

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

/** Thống kê doanh thu chi tiết theo 1 phim (đúng nghiệp vụ rạp) */
const movieRevenue = async (req, res) => {
  try {
    const movieId = String(req.query.movieId || "").trim();
    const movieTitleQuery = String(req.query.movie || "").trim();
    const { from, to } = getRange(req);

    let movie = null;
    if (movieId && isObjectId(movieId)) {
      movie = await Movie.findById(movieId).lean();
    }
    if (!movie && movieTitleQuery) {
      movie = await Movie.findOne({
        title: {
          $regex: `^${movieTitleQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
          $options: "i",
        },
      }).lean();
    }
    if (!movie) {
      return res.status(404).json({ success: false, message: "Không tìm thấy phim" });
    }

    const showtimes = await Showtime.find({
      movie: movie._id,
      startTime: { $gte: from, $lte: to },
      status: { $ne: "cancelled" },
    })
      .populate("room", "name totalSeats type")
      .sort({ startTime: 1 })
      .lean();

    const showtimeIds = showtimes.map((item) => String(item._id));
    const showtimeObjectIds = showtimes.map((item) => item._id);
    const showtimeMap = new Map(showtimes.map((item) => [String(item._id), item]));

    // Doanh thu theo ngày chiếu (startTime suất), không theo ngày tạo đơn
    const [quickBookings, legacyBookings, bookedSeats, reviews] = await Promise.all([
      showtimeIds.length
        ? QuickBooking.find({
            status: "paid",
            showtimeId: { $in: showtimeIds },
          }).lean()
        : QuickBooking.find({
            status: "paid",
            movieTitle: movie.title,
            createdAt: { $gte: from, $lte: to },
          }).lean(),
      showtimeObjectIds.length
        ? Booking.find({
            ...paidBookingMatch,
            showtime: { $in: showtimeObjectIds },
          }).lean()
        : Promise.resolve([]),
      showtimeIds.length
        ? BookedSeat.find({
            showtimeId: { $in: showtimeIds },
            status: "booked",
          }).lean()
        : Promise.resolve([]),
      Review.find({ movie: movie._id }).select("rating").lean().catch(() => []),
    ]);

    const validQuick = quickBookings.filter((booking) => {
      if (booking.showtimeId) return showtimeMap.has(String(booking.showtimeId));
      return booking.movieTitle === movie.title;
    });

    let totalRevenue = 0;
    let totalTickets = 0;
    let totalOrders = 0;

    const dayMap = new Map();
    const showtimeRevenueMap = new Map();
    const roomMap = new Map();
    const hourMap = new Map();
    const seatRowMap = new Map();

    const bumpSeatRow = (label) => {
      const row = String(label || "").replace(/\d+/g, "").toUpperCase() || "?";
      seatRowMap.set(row, (seatRowMap.get(row) || 0) + 1);
    };

    const bumpDay = (dateKey, revenue, tickets) => {
      const current = dayMap.get(dateKey) || { date: dateKey, revenue: 0, tickets: 0, bookings: 0 };
      current.revenue += revenue;
      current.tickets += tickets;
      current.bookings += 1;
      dayMap.set(dateKey, current);
    };

    const bumpShowtime = (sid, revenue, tickets) => {
      if (!sid) return;
      const current = showtimeRevenueMap.get(sid) || {
        showtimeId: sid,
        revenue: 0,
        tickets: 0,
        bookings: 0,
      };
      current.revenue += revenue;
      current.tickets += tickets;
      current.bookings += 1;
      showtimeRevenueMap.set(sid, current);
    };

    const bumpRoom = (roomName, revenue, tickets) => {
      const key = roomName || "Chưa rõ phòng";
      const current = roomMap.get(key) || { room: key, revenue: 0, tickets: 0 };
      current.revenue += revenue;
      current.tickets += tickets;
      roomMap.set(key, current);
    };

    const bumpHour = (hour, revenue, tickets) => {
      const current = hourMap.get(hour) || { hour, revenue: 0, tickets: 0, showtimes: 0 };
      current.revenue += revenue;
      current.tickets += tickets;
      hourMap.set(hour, current);
    };

    validQuick.forEach((booking) => {
      const revenue = Number(booking.totalPrice || 0);
      const tickets = seatCount(booking);
      const showtime = showtimeMap.get(String(booking.showtimeId || ""));
      const dateKey = showtime?.startTime
        ? new Date(showtime.startTime).toISOString().slice(0, 10)
        : new Date(booking.createdAt).toISOString().slice(0, 10);

      totalRevenue += revenue;
      totalTickets += tickets;
      totalOrders += 1;
      bumpDay(dateKey, revenue, tickets);
      if (showtime) {
        bumpShowtime(String(showtime._id), revenue, tickets);
        bumpRoom(showtime.room?.name, revenue, tickets);
        bumpHour(new Date(showtime.startTime).getHours(), revenue, tickets);
      }
    });

    legacyBookings.forEach((booking) => {
      const revenue = Number(booking.totalPrice || 0);
      const tickets = seatCount(booking);
      const showtime = showtimeMap.get(String(booking.showtime || ""));
      const dateKey = showtime?.startTime
        ? new Date(showtime.startTime).toISOString().slice(0, 10)
        : new Date(booking.createdAt).toISOString().slice(0, 10);

      totalRevenue += revenue;
      totalTickets += tickets;
      totalOrders += 1;
      bumpDay(dateKey, revenue, tickets);
      if (showtime) {
        bumpShowtime(String(showtime._id), revenue, tickets);
        bumpRoom(showtime.room?.name, revenue, tickets);
        bumpHour(new Date(showtime.startTime).getHours(), revenue, tickets);
      }
    });

    // Ưu tiên ghế booked thật; fallback ghế trên đơn nếu chưa có BookedSeat
    if (bookedSeats.length) {
      bookedSeats.forEach((item) => bumpSeatRow(item.seatLabel));
    } else {
      validQuick.forEach((booking) => (booking.seats || []).forEach(bumpSeatRow));
      legacyBookings.forEach((booking) =>
        (booking.seats || booking.seatLabels || []).forEach(bumpSeatRow),
      );
    }

    let capacity = 0;
    let soldSeats = 0;
    const bookedByShowtime = new Map();
    bookedSeats.forEach((item) => {
      const key = String(item.showtimeId);
      bookedByShowtime.set(key, (bookedByShowtime.get(key) || 0) + 1);
    });

    showtimes.forEach((showtime) => {
      const totalSeats = Number(showtime.room?.totalSeats || 0);
      const sold = bookedByShowtime.get(String(showtime._id)) || 0;
      capacity += totalSeats;
      soldSeats += sold;
      const hour = new Date(showtime.startTime).getHours();
      const hourItem = hourMap.get(hour) || { hour, revenue: 0, tickets: 0, showtimes: 0 };
      hourItem.showtimes += 1;
      hourMap.set(hour, hourItem);
    });

    const occupancyRate = capacity > 0 ? Math.round((soldSeats / capacity) * 100) : 0;

    // Đủ mọi ngày trong khoảng lọc (ngày không bán = 0) để biểu đồ đúng nghiệp vụ
    const revenueByDay = [];
    const cursor = new Date(from);
    cursor.setHours(0, 0, 0, 0);
    const endDay = new Date(to);
    endDay.setHours(0, 0, 0, 0);
    while (cursor <= endDay) {
      const dateKey = cursor.toISOString().slice(0, 10);
      revenueByDay.push(
        dayMap.get(dateKey) || { date: dateKey, revenue: 0, tickets: 0, bookings: 0 },
      );
      cursor.setDate(cursor.getDate() + 1);
    }

    const revenueByShowtime = [...showtimeRevenueMap.values()]
      .map((item) => {
        const showtime = showtimeMap.get(item.showtimeId);
        const start = showtime?.startTime ? new Date(showtime.startTime) : null;
        const label = start
          ? `${start.toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            })} · ${start.toLocaleDateString("vi-VN")}`
          : item.showtimeId;
        return {
          ...item,
          label,
          roomName: showtime?.room?.name || "",
          percent: totalRevenue > 0 ? Math.round((item.revenue / totalRevenue) * 1000) / 10 : 0,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);

    const revenueByRoom = [...roomMap.values()]
      .map((item) => ({
        ...item,
        percent: totalRevenue > 0 ? Math.round((item.revenue / totalRevenue) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const topHourSlots = [...hourMap.values()]
      .map((item) => {
        const start = String(item.hour).padStart(2, "0");
        const end = String((item.hour + 2) % 24).padStart(2, "0");
        const slotCapacity = showtimes
          .filter((showtime) => new Date(showtime.startTime).getHours() === item.hour)
          .reduce((sum, showtime) => sum + Number(showtime.room?.totalSeats || 0), 0);
        const occupancy =
          slotCapacity > 0 ? Math.round((item.tickets / slotCapacity) * 100) : 0;
        return {
          label: `${start}:00 - ${end}:00`,
          hour: item.hour,
          revenue: item.revenue,
          tickets: item.tickets,
          showtimes: item.showtimes,
          occupancy,
        };
      })
      .sort((a, b) => b.occupancy - a.occupancy || b.tickets - a.tickets)
      .slice(0, 6);

    const seatRows = [...seatRowMap.entries()]
      .map(([row, count]) => ({
        label: `Hàng ${row}`,
        row,
        tickets: count,
        percent: totalTickets > 0 ? Math.round((count / totalTickets) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.tickets - a.tickets)
      .slice(0, 8);

    const ratingValues = (reviews || [])
      .map((item) => Number(item.rating || 0))
      .filter((n) => n > 0);
    const ratingAvg =
      ratingValues.length > 0
        ? Math.round((ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length) * 10) / 10
        : Number(movie.rating || 0);

    return ok(res, {
      from: from.toISOString(),
      to: to.toISOString(),
      movie: {
        id: movie._id,
        title: movie.title,
        posterUrl: movie.posterUrl || movie.poster || "",
        genre: movie.genre,
        duration: movie.duration,
        director: movie.director || "",
        cast: movie.cast || [],
        synopsis: movie.synopsis || movie.description || "",
        ageRating: movie.ageRating || "",
        status: movie.status,
        releaseDate: movie.releaseDate || null,
        rating: ratingAvg,
        ratingCount: ratingValues.length,
      },
      summary: {
        totalRevenue,
        totalTickets,
        totalOrders,
        totalShowtimes: showtimes.length,
        occupancyRate,
        averageOrder: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
      },
      revenueByDay,
      revenueByShowtime,
      revenueByRoom,
      topHourSlots,
      seatRows,
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
  movieRevenue,
};
