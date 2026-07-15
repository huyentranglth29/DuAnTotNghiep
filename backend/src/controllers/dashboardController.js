const Booking = require("../models/Booking");
const Movie = require("../models/Movie");
const Product = require("../models/Product");
const Room = require("../models/Room");
const Showtime = require("../models/Showtime");
const Ticket = require("../models/Ticket");
const User = require("../models/User");
const Voucher = require("../models/Voucher");

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
      paidTickets,
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
      Ticket.aggregate([
        { $match: { status: { $in: ["valid", "used"] } } },
        { $group: { _id: null, total: { $sum: "$price" } } },
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
    const ticketRevenue = paidTickets[0]?.total || 0;

    return res.json({
      success: true,
      data: {
        totalMovies,
        totalUsers,
        totalRooms,
        totalShowtimes,
        totalTickets,
        totalBookings,
        totalProducts,
        totalVouchers,
        totalRevenue: bookingRevenue || ticketRevenue,
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
};
