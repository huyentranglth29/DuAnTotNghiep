const express = require("express");
const createAdminCrudController = require("../controllers/adminCrudController");
const { getDashboard } = require("../controllers/dashboardController");
const reports = require("../controllers/reportController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const Booking = require("../models/Booking");
const Movie = require("../models/Movie");
const Notification = require("../models/Notification");
const Product = require("../models/Product");
const Review = require("../models/Review");
const Room = require("../models/Room");
const Seat = require("../models/Seat");
const Showtime = require("../models/Showtime");
const Ticket = require("../models/Ticket");
const User = require("../models/User");
const Voucher = require("../models/Voucher");

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get("/dashboard", getDashboard);
router.get("/reports/revenue-by-day", reports.revenueByDay);
router.get("/reports/revenue-by-movie", reports.revenueByMovie);
router.get("/reports/revenue-by-room", reports.revenueByRoom);
router.get("/reports/tickets-by-day", reports.ticketsByDay);
router.get("/reports/seat-occupancy", reports.seatOccupancy);
router.get("/reports/top-movies", reports.topMovies);

const resources = {
  movies: createAdminCrudController(Movie, {
    keywordFields: ["title", "description", "synopsis", "director", "genre"],
  }),
  rooms: createAdminCrudController(Room, {
    keywordFields: ["name", "type", "status"],
  }),
  seats: createAdminCrudController(Seat, {
    populate: "room",
    keywordFields: ["row", "type", "status"],
  }),
  showtimes: createAdminCrudController(Showtime, {
    populate: [
      { path: "movie", select: "title posterUrl duration status" },
      { path: "room", select: "name type totalSeats status" },
    ],
    keywordFields: ["status"],
  }),
  vouchers: createAdminCrudController(Voucher, {
    keywordFields: ["code", "description", "status"],
  }),
  products: createAdminCrudController(Product, {
    keywordFields: ["name", "description"],
  }),
  users: createAdminCrudController(User, {
    keywordFields: ["fullName", "email", "phone", "role", "status"],
  }),
  tickets: createAdminCrudController(Ticket, {
    populate: "booking showtime seat",
    keywordFields: ["code", "status"],
  }),
  bookings: createAdminCrudController(Booking, {
    populate: "user showtime seats voucher",
    keywordFields: ["status", "paymentMethod", "paymentStatus"],
  }),
  reviews: createAdminCrudController(Review, {
    populate: "movie user",
    keywordFields: ["comment", "status"],
  }),
  notifications: createAdminCrudController(Notification, {
    keywordFields: ["title", "content", "target"],
  }),
};

Object.entries(resources).forEach(([resource, controller]) => {
  router.get(`/${resource}`, controller.getAll);
  router.get(`/${resource}/:id`, controller.getById);
  router.post(`/${resource}`, controller.create);
  router.put(`/${resource}/:id`, controller.update);
  router.delete(`/${resource}/:id`, controller.remove);
});

module.exports = router;
