const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Movie = require("../models/Movie");
const Room = require("../models/Room");
const Seat = require("../models/Seat");
const Showtime = require("../models/Showtime");
const Ticket = require("../models/Ticket");

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

module.exports = {
  revenueByDay,
  revenueByMovie,
  revenueByRoom,
  ticketsByDay,
  seatOccupancy,
  topMovies,
};
