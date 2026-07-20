const express = require("express");
const createAdminCrudController = require("../controllers/adminCrudController");
const {
  getDashboard,
  getAdminOverview,
} = require("../controllers/dashboardController");
const {
  createShowtime,
  updateShowtime,
  deleteShowtime,
  getRoomSuggestion,
  checkShowtimeConflicts,
  getShowtimeOccupancy,
} = require("../controllers/showtimeController");
const reports = require("../controllers/reportController");
const adminUser = require("../controllers/adminUserController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const Movie = require("../models/Movie");
const Notification = require("../models/Notification");
const Product = require("../models/Product");
const Review = require("../models/Review");
const Room = require("../models/Room");
const Seat = require("../models/Seat");
const Showtime = require("../models/Showtime");
const Ticket = require("../models/Ticket");
const Voucher = require("../models/Voucher");
const { createNotification } = require("../services/notificationService");
const adminBooking = require("../controllers/adminBookingController");

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get("/dashboard", getDashboard);
router.get("/dashboard/overview", getAdminOverview);
router.get("/reports/revenue-by-day", reports.revenueByDay);
router.get("/reports/revenue-by-movie", reports.revenueByMovie);
router.get("/reports/revenue-by-room", reports.revenueByRoom);
router.get("/reports/tickets-by-day", reports.ticketsByDay);
router.get("/reports/seat-occupancy", reports.seatOccupancy);
router.get("/reports/top-movies", reports.topMovies);
router.get("/reports/voucher-stats", reports.voucherStats);

// Đơn đặt vé từ User app (QuickBooking)
router.get("/bookings/movies", adminBooking.getOrderMovies);
router.get("/bookings", adminBooking.listOrders);
router.get("/bookings/:id", adminBooking.getOrderById);
router.put("/bookings/:id", adminBooking.updateOrder);

// Quản lý người dùng (thống kê + list + lock/unlock/soft-delete)
router.get("/users/stats", adminUser.getUserStats);
router.get("/users/export", adminUser.exportUsers);
router.get("/users", adminUser.listUsers);
router.get("/users/:id", adminUser.getUserById);
router.put("/users/:id", adminUser.updateUser);
router.post("/users/:id/lock", adminUser.lockUser);
router.post("/users/:id/unlock", adminUser.unlockUser);

const resources = {
  movies: createAdminCrudController(Movie, {
    keywordFields: ["title", "description", "synopsis", "director", "genre"],
    afterCreate: movie => createNotification({
      title: `Phim mới: ${movie.title}`,
      content: `${movie.title} vừa được cập nhật trên FilmGo. Xem thông tin và lịch chiếu ngay!`,
      type: "phim", entityId: movie._id, action: "mo_chi_tiet_phim", image: movie.posterUrl,
    }),
  }),
  rooms: createAdminCrudController(Room, {
    keywordFields: ["name", "type", "status"],
  }),
  seats: createAdminCrudController(Seat, {
    populate: "room",
    keywordFields: ["row", "type", "status"],
  }),
  vouchers: createAdminCrudController(Voucher, {
    keywordFields: ["code", "description", "status"],
    afterCreate: voucher => createNotification({
      title: `Voucher mới: ${voucher.code}`,
      content: `${voucher.description || "Ưu đãi mới từ FilmGo"}. Nhận ngay trước khi hết lượt!`,
      type: "voucher", entityId: voucher._id, action: "nhan_voucher",
    }),
  }),
  products: createAdminCrudController(Product, {
    keywordFields: ["name", "description"],
  }),
  tickets: createAdminCrudController(Ticket, {
    populate: [
      { path: "booking", select: "ticketCode movieTitle roomName totalPrice status paymentStatus" },
      {
        path: "showtime",
        populate: [
          { path: "movie", select: "title" },
          { path: "room", select: "name" },
        ],
      },
      { path: "seat", populate: { path: "room", select: "name" } },
    ],
    keywordFields: ["code", "status"],
  }),
  reviews: createAdminCrudController(Review, {
    populate: "movie user",
    keywordFields: ["comment", "status"],
  }),
  notifications: createAdminCrudController(Notification, {
    keywordFields: ["title", "content", "target"],
  }),
};

const showtimeCrud = createAdminCrudController(Showtime, {
  populate: [
    { path: "movie", select: "title posterUrl duration ageRating genre status" },
    { path: "room", select: "name type totalSeats status" },
  ],
  keywordFields: ["status"],
});

// Suất chiếu: list/detail dùng CRUD; create/update có kiểm tra trùng + gap 15'
router.get("/showtimes/suggest", getRoomSuggestion);
router.get("/showtimes/occupancy", getShowtimeOccupancy);
router.post("/showtimes/check-conflict", checkShowtimeConflicts);
router.get("/showtimes", showtimeCrud.getAll);
router.get("/showtimes/:id", showtimeCrud.getById);
router.post("/showtimes", createShowtime);
router.put("/showtimes/:id", updateShowtime);
router.delete("/showtimes/:id", deleteShowtime);

Object.entries(resources).forEach(([resource, controller]) => {
  router.get(`/${resource}`, controller.getAll);
  router.get(`/${resource}/:id`, controller.getById);
  router.post(`/${resource}`, controller.create);
  router.put(`/${resource}/:id`, controller.update);
  router.delete(`/${resource}/:id`, controller.remove);
});

module.exports = router;
