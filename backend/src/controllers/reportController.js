const mongoose = require("mongoose");
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

const revenueByDay = async (req, res) => {
  try {
    const { from, to } = getRange(req);
    const data = await Booking.aggregate([
      { $match: { ...paidBookingMatch, createdAt: { $gte: from, $lte: to } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$totalPrice" },
          bookings: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: "$_id", revenue: 1, bookings: 1 } },
    ]);

    return ok(res, data);
  } catch (error) {
    return fail(res, error);
  }
};

const revenueByMovie = async (req, res) => {
  try {
    const data = await Booking.aggregate([
      { $match: paidBookingMatch },
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
        $group: {
          _id: "$showtime.movie",
          revenue: { $sum: "$totalPrice" },
          bookings: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: Movie.collection.name,
          localField: "_id",
          foreignField: "_id",
          as: "movie",
        },
      },
      { $unwind: "$movie" },
      { $sort: { revenue: -1 } },
      {
        $project: {
          _id: 0,
          movieId: "$_id",
          title: "$movie.title",
          revenue: 1,
          bookings: 1,
        },
      },
    ]);

    return ok(res, data);
  } catch (error) {
    return fail(res, error);
  }
};

const revenueByRoom = async (req, res) => {
  try {
    const data = await Booking.aggregate([
      { $match: paidBookingMatch },
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
        $group: {
          _id: "$showtime.room",
          revenue: { $sum: "$totalPrice" },
          bookings: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: Room.collection.name,
          localField: "_id",
          foreignField: "_id",
          as: "room",
        },
      },
      { $unwind: "$room" },
      { $sort: { revenue: -1 } },
      {
        $project: {
          _id: 0,
          roomId: "$_id",
          name: "$room.name",
          type: "$room.type",
          revenue: 1,
          bookings: 1,
        },
      },
    ]);

    return ok(res, data);
  } catch (error) {
    return fail(res, error);
  }
};

const ticketsByDay = async (req, res) => {
  try {
    const { from, to } = getRange(req);
    const data = await Ticket.aggregate([
      { $match: { createdAt: { $gte: from, $lte: to } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          tickets: { $sum: 1 },
          used: { $sum: { $cond: [{ $eq: ["$status", "used"] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: "$_id", tickets: 1, used: 1, cancelled: 1 } },
    ]);

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

    const showtimes = await Showtime.find(match).populate("room", "name totalSeats");
    const data = [];

    for (const showtime of showtimes) {
      const totalSeats = showtime.room?.totalSeats || await Seat.countDocuments({ room: showtime.room?._id });
      const soldTickets = await Ticket.countDocuments({
        showtime: showtime._id,
        status: { $in: ["valid", "used"] },
      });

      data.push({
        showtimeId: showtime._id,
        room: showtime.room?.name || "",
        totalSeats,
        soldTickets,
        occupancyRate: totalSeats ? Math.round((soldTickets / totalSeats) * 100) : 0,
      });
    }

    return ok(res, data);
  } catch (error) {
    return fail(res, error);
  }
};

const topMovies = async (req, res) => {
  try {
    const limit = Math.max(Number(req.query.limit) || 5, 1);
    const data = await Booking.aggregate([
      { $match: paidBookingMatch },
      {
        $lookup: {
          from: Showtime.collection.name,
          localField: "showtime",
          foreignField: "_id",
          as: "showtime",
        },
      },
      { $unwind: "$showtime" },
      { $unwind: "$seats" },
      {
        $group: {
          _id: "$showtime.movie",
          revenue: { $sum: "$totalPrice" },
          tickets: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: Movie.collection.name,
          localField: "_id",
          foreignField: "_id",
          as: "movie",
        },
      },
      { $unwind: "$movie" },
      { $sort: { revenue: -1, tickets: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          movieId: "$_id",
          title: "$movie.title",
          revenue: 1,
          tickets: 1,
        },
      },
    ]);

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
