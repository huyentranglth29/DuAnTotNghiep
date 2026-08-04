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
const Genre = require("../models/Genre");
const QuickBooking = require("../models/QuickBooking");
const Payment = require("../models/Payment");
const MovieReminder = require("../models/MovieReminder");
const { createNotification } = require("../services/notificationService");
const {syncAllMovieScheduleStates} = require("../services/movieScheduleStateService");
const adminBooking = require("../controllers/adminBookingController");
const adminSeatMap = require("../controllers/adminSeatMapController");
const adminAi = require("../controllers/adminAiController");
const adminTicket = require("../controllers/adminTicketController");
const adminPayment = require("../controllers/adminPaymentController");

const startOfTodayVN = () => {
  const key = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return new Date(`${key}T00:00:00+07:00`);
};

const CATEGORY_LABELS = {
  combo: "Combo",
  popcorn: "Bắp",
  drink: "Nước",
  snack: "Snack",
};

const resolveProductCategory = (item = {}) => {
  const name = String(item.name || "")
    .toLocaleLowerCase("vi")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
  if (name.includes("combo")) return "combo";
  if (name.includes("bap") || name.includes("popcorn") || name.includes("corn")) {
    return "popcorn";
  }
  if (
    name.includes("nuoc") ||
    name.includes("drink") ||
    name.includes("coca") ||
    name.includes("pepsi") ||
    name.includes("sprite") ||
    name.includes("fanta") ||
    name.includes("tra ") ||
    name.startsWith("tra")
  ) {
    return "drink";
  }
  if (CATEGORY_LABELS[item.category]) return item.category;
  return "snack";
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
      category: resolveProductCategory(item),
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

// Giao dịch thanh toán, gồm cả chờ, hủy, thất bại và hết hạn.
router.get("/payments", adminPayment.listPayments);

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
    next.target = "all";
  }

  return next;
};

const notificationRecipientMatch = {
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

  const recipientCount = await User.countDocuments(notificationRecipientMatch);

  if (!userIds.length) {
    return items.map((item) => ({
      ...item,
      recipientScope: "enabledUsers",
      recipientLabel: `Người dùng đã bật thông báo (${recipientCount} người)`,
      recipientCount,
    }));
  }

  const users = await User.find({_id: {$in: userIds}})
    .select("fullName email notificationEnabled phone")
    .lean();
  const userMap = new Map(users.map((user) => [String(user._id), user]));

  return items.map((item) => {
    const rawUser = item.user;
    const userId =
      rawUser && typeof rawUser === "object"
        ? String(rawUser._id || rawUser.id || "")
        : String(rawUser || "");
    const user = userMap.get(userId);

    if (!user) {
      return {
        ...item,
        recipientScope: "enabledUsers",
        recipientLabel: `Người dùng đã bật thông báo (${recipientCount} người)`,
        recipientCount,
      };
    }

    return {
      ...item,
      user,
      recipientScope: "singleUser",
      recipientName: user.fullName || "Người dùng",
      recipientEmail: user.email || "",
      recipientLabel: user.fullName || "Người dùng",
      recipientCount: 1,
    };
  });
};

router.get("/notifications/:id/recipients", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({success: false, message: "ID thông báo không hợp lệ"});
    }

    const notification = await Notification.findById(req.params.id).lean();
    if (!notification) {
      return res.status(404).json({success: false, message: "Không tìm thấy thông báo"});
    }

    let scope = "enabledUsers";
    let users = [];
    if (notification.user) {
      scope = "singleUser";
      users = await User.find({_id: notification.user})
        .select("fullName email phone notificationEnabled")
        .lean();
    } else if (
      notification.type === "phim" &&
      notification.entityId &&
      notification.action === "nhac_mo_ban"
    ) {
      scope = "movieReminder";
      const reminderUserIds = await MovieReminder.find({movie: notification.entityId})
        .distinct("user");
      users = await User.find({_id: {$in: reminderUserIds}})
        .select("fullName email phone notificationEnabled")
        .sort({fullName: 1})
        .lean();
    } else {
      users = await User.find(notificationRecipientMatch)
        .select("fullName email phone notificationEnabled")
        .sort({fullName: 1})
        .limit(500)
        .lean();
    }

    return res.json({
      success: true,
      data: {
        scope,
        count: users.length,
        recipients: users.map((user) => ({
          id: user._id,
          fullName: user.fullName || "Người dùng FilmGo",
          email: user.email || "",
          phone: user.phone || "",
          notificationEnabled: user.notificationEnabled !== false,
        })),
      },
    });
  } catch (error) {
    return res.status(500).json({success: false, message: error.message});
  }
});

const genreSlug = (value = "") =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const normalizeGenreBody = (body = {}) => {
  const name = String(body.name || "").trim().replace(/\s+/g, " ");
  return {
    ...body,
    name,
    slug: genreSlug(name),
    status: body.status === "inactive" ? "inactive" : "active",
  };
};

const syncGenresFromMovies = async () => {
  const movies = await Movie.find().select("genre -_id").lean();
  const names = new Map();

  movies.forEach((movie) => {
    const raw = Array.isArray(movie.genre) ? movie.genre : [movie.genre];
    raw
      .flatMap((value) => String(value || "").split(/[,/|]/))
      .map((value) => value.trim().replace(/\s+/g, " "))
      .filter(Boolean)
      .forEach((name) => names.set(genreSlug(name), name));
  });

  if (!names.size) return;
  await Genre.bulkWrite(
    [...names.entries()].map(([slug, name]) => ({
      updateOne: {
        filter: {slug},
        update: {$setOnInsert: {name, slug, status: "active"}},
        upsert: true,
      },
    })),
    {ordered: false},
  );
};

const enrichGenresWithMovieCount = async (items = []) => {
  const movies = await Movie.find().select("genre -_id").lean();
  const counts = new Map();
  movies.forEach((movie) => {
    const values = Array.isArray(movie.genre) ? movie.genre : [movie.genre];
    values
      .flatMap((value) => String(value || "").split(/[,/|]/))
      .map((value) => genreSlug(value))
      .filter(Boolean)
      .forEach((slug) => counts.set(slug, (counts.get(slug) || 0) + 1));
  });
  return items.map((item) => ({...item, movieCount: counts.get(item.slug) || 0}));
};

const genreCrud = createAdminCrudController(Genre, {
  keywordFields: ["name", "slug", "status"],
  prepareBody: normalizeGenreBody,
  enrichList: enrichGenresWithMovieCount,
});

const prepareMovieBody = (body = {}) => {
  const next = {...body};
  if (["coming-soon", "coming_soon"].includes(next.status)) {
    const publishedAt = new Date(next.publishedAt);
    const saleAt = new Date(next.ticketSaleStartAt);
    if ([publishedAt, saleAt].some((date) => Number.isNaN(date.getTime()))) {
      const error = new Error("Vui lòng nhập đủ thời điểm công bố và mở bán");
      error.statusCode = 400;
      throw error;
    }
    if (publishedAt > saleAt) {
      const error = new Error("Thời gian phải theo thứ tự: Công bố ≤ Mở bán");
      error.statusCode = 400;
      throw error;
    }
  }
  return next;
};

router.get("/genres", async (req, res) => {
  try {
    await syncGenresFromMovies();
    return genreCrud.getAll(req, res);
  } catch (error) {
    return res.status(500).json({success: false, message: error.message});
  }
});
router.get("/genres/:id", genreCrud.getById);
router.post("/genres", genreCrud.create);
router.put("/genres/:id", genreCrud.update);
router.delete("/genres/:id", async (req, res) => {
  const genre = await Genre.findById(req.params.id);
  if (!genre) return res.status(404).json({success: false, message: "Thể loại không tồn tại"});
  const pattern = new RegExp(`(^|[,/|]\\s*)${genre.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\s*[,/|]|$)`, "i");
  const used = await Movie.exists({genre: pattern});
  if (used) {
    return res.status(400).json({success: false, message: "Thể loại đang được phim sử dụng. Hãy tạm tắt thay vì xóa."});
  }
  return genreCrud.remove(req, res);
});

const resources = {
  movies: createAdminCrudController(Movie, {
    beforeList: () => syncAllMovieScheduleStates(),
    keywordFields: ["title", "description", "synopsis", "director", "genre"],
    prepareBody: prepareMovieBody,
    afterCreate: movie =>
      ["coming-soon", "coming_soon"].includes(movie.status) &&
      (!movie.publishedAt || new Date(movie.publishedAt) <= new Date())
        ? createNotification({
          title: `Phim sắp chiếu: ${movie.title}`,
          content: `${movie.title} vừa được công bố trên FilmGo. Xem thông tin phim ngay!`,
          type: "phim", entityId: movie._id, action: "mo_chi_tiet_phim", image: movie.posterUrl,
        })
        : null,
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
    ],
    keywordFields: ["code", "status"],
  }),
  reviews: createAdminCrudController(Review, {
    populate: [
      { path: "movie", select: "title posterUrl" },
      { path: "user", select: "fullName email phone avatar" },
    ],
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

// Vé trên ứng dụng khách được lưu trong QuickBooking; gộp chúng với vé legacy.
resources.tickets.getAll = adminTicket.getAll;
resources.tickets.update = adminTicket.update;

const showtimeCrud = createAdminCrudController(Showtime, {
  populate: [
    { path: "movie", select: "title posterUrl duration ageRating genre status expectedReleaseDate publishedAt" },
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
