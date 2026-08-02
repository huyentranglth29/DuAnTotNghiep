const express = require("express");
const mongoose = require("mongoose");
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
const NewsEvent = require("../models/NewsEvent");
const Product = require("../models/Product");
const Review = require("../models/Review");
const Room = require("../models/Room");
const Seat = require("../models/Seat");
const Showtime = require("../models/Showtime");
const Ticket = require("../models/Ticket");
const User = require("../models/User");
const Voucher = require("../models/Voucher");
const QuickBooking = require("../models/QuickBooking");
const Payment = require("../models/Payment");
const { createNotification } = require("../services/notificationService");
const adminBooking = require("../controllers/adminBookingController");
const adminSeatMap = require("../controllers/adminSeatMapController");
const adminAi = require("../controllers/adminAiController");

const startOfTodayVN = () => {
  const key = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return new Date(`${key}T00:00:00+07:00`);
};

const enrichProductsWithSoldToday = async (items = []) => {
  const start = startOfTodayVN();
  const soldMap = new Map();

  const addCombo = (combo) => {
    const id = String(combo?.product?._id || combo?.product || "");
    if (!id) return;
    soldMap.set(id, (soldMap.get(id) || 0) + Number(combo.quantity || 0));
  };

  const [quickBookings, payments] = await Promise.all([
    QuickBooking.find({
      status: "paid",
      createdAt: { $gte: start },
      "combos.0": { $exists: true },
    })
      .select("combos")
      .lean(),
    Payment.find({
      status: "da_thanh_toan",
      $or: [{ paidAt: { $gte: start } }, { updatedAt: { $gte: start } }],
      "bookingData.combos.0": { $exists: true },
    })
      .select("bookingData.combos")
      .lean(),
  ]);

  quickBookings.forEach((row) => (row.combos || []).forEach(addCombo));
  payments.forEach((row) => (row.bookingData?.combos || []).forEach(addCombo));

  return items.map((item) => {
    const id = String(item._id || item.id || "");
    return {
      ...item,
      soldToday: soldMap.get(id) || 0,
    };
  });
};

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get("/dashboard", getDashboard);
router.get("/dashboard/overview", getAdminOverview);
router.get("/ai/context", adminAi.getAdminAiContextSummary);
router.post("/ai/chat", adminAi.chatWithAdminAi);
router.get("/reports/revenue-by-day", reports.revenueByDay);
router.get("/reports/revenue-by-movie", reports.revenueByMovie);
router.get("/reports/revenue-by-room", reports.revenueByRoom);
router.get("/reports/tickets-by-day", reports.ticketsByDay);
router.get("/reports/seat-occupancy", reports.seatOccupancy);
router.get("/reports/top-movies", reports.topMovies);
router.get("/reports/voucher-stats", reports.voucherStats);
router.get("/reports/movie-revenue", reports.movieRevenue);

// Sơ đồ ghế trực quan theo suất chiếu
router.get("/seat-map/:showtimeId", adminSeatMap.getSeatMap);
router.post("/seat-map/:showtimeId/release", adminSeatMap.releaseHeldSeat);
router.post("/seat-map/seats/:seatId/lock", adminSeatMap.lockSeat);
router.post("/seat-map/seats/:seatId/unlock", adminSeatMap.unlockSeat);
router.post("/seat-map/seats/:seatId/type", adminSeatMap.changeSeatType);

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

const normalizeNotificationBody = async (body = {}) => {
  const next = { ...body };
  const target = String(next.target || "").trim();
  const user = String(next.user || "").trim();
  const userId = user || (mongoose.Types.ObjectId.isValid(target) ? target : "");

  if (userId) {
    const recipient = await User.findOne({
      _id: userId,
      role: "user",
      status: "active",
      $and: [
        {
          $or: [
            {notificationEnabled: true},
            {notificationEnabled: {$exists: false}},
          ],
        },
        {
          $or: [{deleted: false}, {deleted: {$exists: false}}, {deleted: null}],
        },
      ],
    }).select("_id");

    if (!recipient) {
      const error = new Error("Người dùng chưa bật thông báo hoặc không tồn tại");
      error.statusCode = 400;
      throw error;
    }

    next.user = recipient._id;
    next.target = "all";
  } else {
    next.user = null;
    next.target = ["all", "vip", "newUser"].includes(target) ? target : "all";
  }

  return next;
};

const enrichNotificationsWithRecipients = async (items = []) => {
  const userIds = [
    ...new Set(
      items
        .map((item) => {
          const user = item.user;
          if (!user) return "";
          if (typeof user === "object") return String(user._id || user.id || "");
          return String(user);
        })
        .filter((id) => mongoose.Types.ObjectId.isValid(id)),
    ),
  ];

  if (!userIds.length) return items;

  const users = await User.find({_id: {$in: userIds}})
    .select("fullName email notificationEnabled")
    .lean();
  const userMap = new Map(users.map((user) => [String(user._id), user]));

  return items.map((item) => {
    const rawUser = item.user;
    const userId =
      rawUser && typeof rawUser === "object"
        ? String(rawUser._id || rawUser.id || "")
        : String(rawUser || "");
    const user = userMap.get(userId);

    if (!user) return item;

    return {
      ...item,
      user,
      recipientName: user.fullName || user.email || "Người dùng",
      recipientEmail: user.email || "",
    };
  });
};

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
    prepareBody: (body = {}) => {
      const next = { ...body };
      const startKey = String(next.startDate || "").slice(0, 10);
      const endKey = String(next.endDate || "").slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(startKey)) {
        next.startDate = new Date(`${startKey}T00:00:00+07:00`);
      }
      if (/^\d{4}-\d{2}-\d{2}$/.test(endKey)) {
        next.endDate = new Date(`${endKey}T23:59:59.999+07:00`);
      }
      return next;
    },
    afterCreate: voucher => createNotification({
      title: `Voucher mới: ${voucher.code}`,
      content: `${voucher.description || "Ưu đãi mới từ FilmGo"}. Nhận ngay trước khi hết lượt!`,
      type: "voucher", entityId: voucher._id, action: "nhan_voucher",
    }),
  }),
  products: createAdminCrudController(Product, {
    keywordFields: ["name", "description", "category"],
    enrichList: enrichProductsWithSoldToday,
    afterCreate: product => createNotification({
      title: `Sản phẩm mới: ${product.name}`,
      content: `${product.name} vừa được thêm vào quầy bắp nước FilmGo.`,
      type: "chung",
      entityId: product._id,
      action: "xem_san_pham",
      image: product.image,
    }),
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
    populate: { path: "user", select: "fullName email notificationEnabled" },
    keywordFields: ["title", "content", "target"],
    prepareBody: normalizeNotificationBody,
    enrichList: enrichNotificationsWithRecipients,
  }),
  "news-events": createAdminCrudController(NewsEvent, {
    populate: "createdBy",
    keywordFields: ["title", "summary", "content", "category", "status"],
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
