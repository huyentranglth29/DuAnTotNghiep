const OpenAI = require("openai");
const { GoogleGenAI } = require("@google/genai");

const BookedSeat = require("../models/BookedSeat");
const Booking = require("../models/Booking");
const Movie = require("../models/Movie");
const NewsEvent = require("../models/NewsEvent");
const Notification = require("../models/Notification");
const Payment = require("../models/Payment");
const Product = require("../models/Product");
const QuickBooking = require("../models/QuickBooking");
const Review = require("../models/Review");
const Room = require("../models/Room");
const Seat = require("../models/Seat");
const Showtime = require("../models/Showtime");
const Ticket = require("../models/Ticket");
const User = require("../models/User");
const UserVoucher = require("../models/UserVoucher");
const Voucher = require("../models/Voucher");

const DEFAULT_MODEL = "gpt-4o-mini";

const MODEL_REGISTRY = [
  { key: "movies", label: "Phim", model: Movie },
  { key: "rooms", label: "Phòng chiếu", model: Room },
  { key: "seats", label: "Ghế", model: Seat },
  { key: "showtimes", label: "Suất chiếu", model: Showtime, populate: "movie room" },
  { key: "bookedSeats", label: "Ghế giữ/đã đặt", model: BookedSeat },
  { key: "quickBookings", label: "Đơn đặt vé nhanh", model: QuickBooking, populate: "user voucher" },
  { key: "bookings", label: "Đơn đặt vé chuẩn", model: Booking, populate: "user showtime seats voucher" },
  { key: "tickets", label: "Vé", model: Ticket, populate: "booking showtime seat" },
  { key: "payments", label: "Thanh toán", model: Payment, populate: "user voucher booking" },
  { key: "users", label: "Người dùng", model: User },
  { key: "vouchers", label: "Voucher", model: Voucher },
  { key: "userVouchers", label: "Voucher người dùng", model: UserVoucher, populate: "user voucher" },
  { key: "products", label: "Sản phẩm/combo", model: Product },
  { key: "reviews", label: "Đánh giá", model: Review, populate: "movie user" },
  { key: "notifications", label: "Thông báo", model: Notification },
  { key: "newsEvents", label: "Tin tức & sự kiện", model: NewsEvent, populate: "createdBy" },
];

const SECRET_FIELD = /(password|token|secret|hash|key|googleId)/i;
const PII_FIELD = /(email|phone|idCard|address|birthDate)/i;
const MOVIE_ACTOR_FIELDS = [
  "actors",
  "cast",
  "dienVien",
  "dienvien",
  "diễn viên",
  "actorList",
  "actor_list",
  "castMembers",
  "performers",
];
const MOVIE_LANGUAGE_FIELDS = ["language", "languages", "ngonNgu", "ngôn ngữ"];

function getModelName() {
  return process.env.OPENAI_MODEL || DEFAULT_MODEL;
}

function getGeminiModelName() {
  return process.env.GEMINI_MODEL || "gemini-flash-latest";
}

function getGeminiModelCandidates() {
  return Array.from(new Set([
    getGeminiModelName(),
    "gemini-flash-latest",
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
  ].filter(Boolean)));
}

function getAiProvider() {
  if (process.env.AI_PROVIDER) return process.env.AI_PROVIDER;
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.OPENAI_API_KEY) return "openai";
  return "local";
}

function getSampleLimit() {
  return Math.min(Number(process.env.ADMIN_AI_SAMPLE_LIMIT || 12), 30);
}

function shouldExposePii() {
  return process.env.ADMIN_AI_EXPOSE_PII === "true";
}

function startOfMonthVN(date = new Date()) {
  const monthKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
  }).format(date);
  return new Date(`${monthKey}-01T00:00:00+07:00`);
}

function dayRangeVN(date = new Date()) {
  const dayKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  return {
    start: new Date(`${dayKey}T00:00:00+07:00`),
    end: new Date(`${dayKey}T23:59:59.999+07:00`),
  };
}

function maskEmail(value = "") {
  const [name, domain] = String(value).split("@");
  if (!domain) return value;
  return `${name.slice(0, 2)}***@${domain}`;
}

function maskPhone(value = "") {
  const text = String(value);
  if (text.length < 6) return "***";
  return `${text.slice(0, 3)}***${text.slice(-2)}`;
}

function sanitizeValue(key, value) {
  if (SECRET_FIELD.test(key)) return "[REDACTED]";
  if (!shouldExposePii() && PII_FIELD.test(key)) {
    if (/email/i.test(key)) return maskEmail(value);
    if (/phone/i.test(key)) return maskPhone(value);
    return "[PII_REDACTED]";
  }
  if (typeof value === "string" && value.length > 700) return `${value.slice(0, 700)}...`;
  return value;
}

function sanitizeDocument(value, parentKey = "") {
  if (value == null) return value;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) {
    return value.slice(0, 20).map(item => sanitizeDocument(item, parentKey));
  }
  if (typeof value === "object") {
    if (value._bsontype === "ObjectId" || typeof value.toHexString === "function") {
      return String(value);
    }
    return Object.entries(value).reduce((acc, [key, item]) => {
      acc[key] = sanitizeDocument(sanitizeValue(key, item), key);
      return acc;
    }, {});
  }
  return sanitizeValue(parentKey, value);
}

function schemaSummary(model) {
  return Object.entries(model.schema.paths).map(([field, schemaType]) => ({
    field,
    type: schemaType.instance,
    ref: schemaType.options?.ref,
    enum: schemaType.enumValues?.length ? schemaType.enumValues : undefined,
    required: Boolean(schemaType.isRequired),
  }));
}

async function sampleModel(resource) {
  let query = resource.model.find({}).sort({ updatedAt: -1, createdAt: -1 }).limit(getSampleLimit()).lean();
  if (resource.populate) {
    query = query.populate(resource.populate);
  }
  const [count, samples] = await Promise.all([
    resource.model.countDocuments({}),
    query,
  ]);
  return {
    key: resource.key,
    label: resource.label,
    collection: resource.model.collection.name,
    count,
    schema: schemaSummary(resource.model),
    recentSamples: sanitizeDocument(samples),
  };
}

async function buildBusinessSnapshot() {
  const now = new Date();
  const [
    paymentStatus,
    bookingStatus,
    movieStatus,
    showtimeStatus,
    upcomingShowtimes,
    paidRevenue,
    monthRevenue,
    productStock,
    reviewStatus,
  ] = await Promise.all([
    Payment.aggregate([
      { $group: { _id: { provider: "$provider", status: "$status" }, count: { $sum: 1 }, amount: { $sum: "$amount" } } },
      { $sort: { "_id.provider": 1, "_id.status": 1 } },
    ]),
    QuickBooking.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 }, revenue: { $sum: "$totalPrice" } } },
      { $sort: { count: -1 } },
    ]),
    Movie.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Showtime.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Showtime.countDocuments({ startTime: { $gte: now }, status: "scheduled" }),
    Payment.aggregate([
      { $match: { status: "da_thanh_toan" } },
      { $group: { _id: null, revenue: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    Payment.aggregate([
      { $match: { status: "da_thanh_toan", paidAt: { $gte: startOfMonthVN(now) } } },
      { $group: { _id: null, revenue: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    Product.find({}).select("name category price stock isActive").sort({ stock: 1 }).limit(12).lean(),
    Review.aggregate([{ $group: { _id: "$status", count: { $sum: 1 }, avgRating: { $avg: "$rating" } } }]),
  ]);

  return sanitizeDocument({
    generatedAt: now.toISOString(),
    paymentStatus,
    bookingStatus,
    movieStatus,
    showtimeStatus,
    upcomingScheduledShowtimes: upcomingShowtimes,
    paidRevenue: paidRevenue[0] || { revenue: 0, count: 0 },
    monthRevenue: monthRevenue[0] || { revenue: 0, count: 0 },
    lowStockProducts: productStock,
    reviewStatus,
  });
}

async function buildAdminContext() {
  const [collections, businessSnapshot] = await Promise.all([
    Promise.all(MODEL_REGISTRY.map(sampleModel)),
    buildBusinessSnapshot(),
  ]);
  return {
    appName: "FilmGo",
    purpose: "Hệ thống đặt vé xem phim gồm app mobile user, web admin, backend Express và MongoDB.",
    privacyNote: shouldExposePii()
      ? "PII đang bật cho AI theo ADMIN_AI_EXPOSE_PII=true; vẫn không gửi password/secret/token."
      : "Email/SĐT/CCCD/địa chỉ/ngày sinh được ẩn bớt; password/secret/token luôn bị che.",
    collections,
    businessSnapshot,
  };
}

function extractOutputText(response) {
  if (response.output_text) return response.output_text;
  const chunks = [];
  for (const item of response.output || []) {
    for (const content of item.content || []) {
      if (content.text) chunks.push(content.text);
    }
  }
  return chunks.join("\n").trim();
}

function cleanAiAnswer(text = "") {
  return String(text)
    .replace(/```[\s\S]*?```/g, match => match.replace(/```/g, ""))
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*/g, "")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\b(businessSnapshot|collection|collections|payments|quickBookings|showtimes|movies)\b/gi, match => {
      const map = {
        businessSnapshot: "dữ liệu hệ thống",
        collection: "dữ liệu",
        collections: "dữ liệu",
        payments: "thanh toán",
        quickBookings: "đơn đặt vé",
        showtimes: "suất chiếu",
        movies: "phim",
      };
      return map[match] || match;
    })
    .replace(/Dạ báo cáo anh\/chị,?\s*/gi, "")
    .replace(/Dạ chào anh\/chị,?\s*/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function looksLikeTechnicalLeak(text = "") {
  const value = String(text).trim();
  return (
    /^["'{[]/.test(value) ||
    /"_id"|ObjectId|CONTEXT JSON|Search CONTEXT|businessSnapshot|recentSamples|let's check|let me check/i.test(value)
  );
}

function findCollection(context, key) {
  return context.collections.find(item => item.key === key) || {};
}

function getStatusRows(rows = []) {
  return rows
    .map(row => {
      const label = typeof row._id === "object"
        ? Object.entries(row._id).map(([key, value]) => `${key}:${value || "unknown"}`).join("/")
        : row._id || "unknown";
      const amount = row.amount || row.revenue;
      return `- ${label}: ${row.count || 0}${amount ? `, ${Number(amount).toLocaleString("vi-VN")}đ` : ""}`;
    })
    .join("\n");
}

function normalizeText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

function formatMoney(value = 0) {
  return `${Number(value || 0).toLocaleString("vi-VN")}đ`;
}

function formatDateTimeVN(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateVN(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
  });
}

function getSeatCount(seats) {
  return Array.isArray(seats) ? seats.length : 0;
}

function movieStatusLabel(status = "") {
  const map = {
    now_showing: "đang chiếu",
    "now-showing": "đang chiếu",
    coming_soon: "sắp chiếu",
    "coming-soon": "sắp chiếu",
    featured: "nổi bật",
    ended: "đã kết thúc",
    stopped: "đã dừng",
  };
  return map[status] || status || "chưa rõ";
}

function paymentStatusLabel(status = "") {
  const map = {
    cho_thanh_toan: "chờ thanh toán",
    da_thanh_toan: "đã thanh toán",
    that_bai: "thất bại",
    het_han: "hết hạn",
    da_huy: "đã hủy",
    da_hoan_tien: "đã hoàn tiền",
  };
  return map[status] || status || "chưa rõ";
}

function bookingStatusLabel(status = "") {
  const map = {
    pending: "đang chờ",
    paid: "đã thanh toán",
    cancelled: "đã hủy",
    refunded: "đã hoàn tiền",
  };
  return map[status] || status || "chưa rõ";
}

function providerLabel(provider = "") {
  const map = {
    payos: "PayOS",
    vnpay: "VNPay",
    mo_phong: "mô phỏng",
  };
  return map[provider] || provider || "chưa rõ";
}

function extractMovieQuery(question = "") {
  return String(question)
    .replace(/^(cho\s+tôi|cho\s+toi|xem|lấy|lay|tìm|tim|thông\s+tin|thong\s+tin|về|ve)\s+/gi, "")
    .replace(/\b(đạo\s+diễn|dao\s+dien|diễn\s+viên|dien\s+vien|dàn\s+cast|dan\s+cast|lịch\s+chiếu|lich\s+chieu|giá\s+vé|gia\s+ve|giá|gia|của|cua|là\s+ai|la\s+ai|bao\s+nhiêu|bao\s+nhieu|có\s+những\s+ai\s+tham\s+gia|co\s+nhung\s+ai\s+tham\s+gia|ai\s+tham\s+gia)\b/gi, " ")
    .replace(/\b(phim|film|movie)\b/gi, "")
    .replace(/[?!.:,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getMovieValue(movie, fields) {
  for (const field of fields) {
    const value = movie?.[field];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return null;
}

function flattenActorNames(value) {
  if (value == null) return [];
  if (Array.isArray(value)) return value.flatMap(flattenActorNames);
  if (typeof value === "object") {
    return flattenActorNames(
      value.name || value.fullName || value.displayName || value.actorName || value.actor || value.ten || value.tenDienVien || value.value,
    );
  }
  return String(value)
    .split(/[,;\n]/)
    .map(item => item.trim())
    .filter(Boolean);
}

function getMovieActors(movie) {
  return Array.from(new Set(
    MOVIE_ACTOR_FIELDS.flatMap(field => flattenActorNames(movie?.[field])),
  ));
}

function scoreMovieMatch(movie, normalizedKeyword, normalizedQuestion) {
  const title = normalizeText(movie.title);
  if (!title) return 0;
  if (title === normalizedKeyword) return 100;
  if (normalizedQuestion.includes(title)) return 90 + Math.min(title.length, 9) / 10;
  if (title.includes(normalizedKeyword)) return 70 + normalizedKeyword.length / Math.max(title.length, 1);
  if (normalizedKeyword.includes(title)) return 60 + title.length / Math.max(normalizedKeyword.length, 1);

  const keywordTokens = new Set(normalizedKeyword.split(/\s+/).filter(token => token.length > 1));
  const titleTokens = new Set(title.split(/\s+/).filter(token => token.length > 1));
  const commonTokens = [...keywordTokens].filter(token => titleTokens.has(token)).length;
  return commonTokens ? (commonTokens / Math.max(keywordTokens.size, titleTokens.size)) * 50 : 0;
}

async function findMovieMatchForQuestion(question = "") {
  const keyword = extractMovieQuery(question);
  if (!keyword || keyword.length < 2) return null;
  const normalizedKeyword = normalizeText(keyword);
  const normalizedQuestion = normalizeText(question);
  const movies = await Movie.find({}).lean();
  const matches = movies
    .map(movie => ({ movie, score: scoreMovieMatch(movie, normalizedKeyword, normalizedQuestion) }))
    .filter(match => match.score > 0)
    .sort((left, right) => right.score - left.score || String(left.movie.title).localeCompare(String(right.movie.title), "vi"));
  if (!matches.length) return null;

  return {
    movie: matches[0].movie,
    alternatives: matches.slice(1, 3).map(match => match.movie),
    ambiguous: matches.length > 1 && matches[0].score < 100 && matches[0].score - matches[1].score < 3,
  };
}

async function findMovieForQuestion(question = "") {
  const match = await findMovieMatchForQuestion(question);
  return match?.movie || null;
}

function formatMovieList(titles = [], emptyText = "Chưa có dữ liệu phù hợp.") {
  const clean = titles.filter(Boolean);
  if (!clean.length) return emptyText;
  return clean.map((title, index) => `${index + 1}. ${title}`).join("\n");
}

async function getMovieScheduleAnswer(question = "") {
  const movie = await findMovieForQuestion(question);
  if (!movie) return "Em chưa tìm thấy phim này trong dữ liệu.";

  const rows = await Showtime.find({
    movie: movie._id,
    status: "scheduled",
    startTime: { $gte: new Date() },
  })
    .populate("room", "name")
    .sort({ startTime: 1 })
    .limit(8)
    .lean();

  if (!rows.length) {
    return `Phim ${movie.title} hiện chưa có suất chiếu sắp tới.`;
  }

  const lines = rows.map(row => {
    const roomName = row.room?.name ? ` - ${row.room.name}` : "";
    return `${formatDateTimeVN(row.startTime)}${roomName}, giá ${formatMoney(row.price)}`;
  });
  return `Lịch chiếu sắp tới của phim ${movie.title}:\n${lines.join("\n")}`;
}

async function getMovieDirectorAnswer(question = "") {
  const match = await findMovieMatchForQuestion(question);
  const movie = match?.movie;
  if (!movie) return "Em chưa tìm thấy phim này trong dữ liệu.";
  return movie.director
    ? `Đạo diễn của phim ${movie.title} là ${movie.director}.`
    : `Phim ${movie.title} hiện chưa có thông tin đạo diễn trong hệ thống.`;
}

async function getMovieActorsAnswer(question = "") {
  const match = await findMovieMatchForQuestion(question);
  const movie = match?.movie;
  if (!movie) return "Em chưa tìm thấy phim này trong dữ liệu.";

  const actors = getMovieActors(movie);
  if (!actors.length) {
    return `Hiện phim ${movie.title} chưa có thông tin diễn viên trong hệ thống.`;
  }
  const clarification = match.ambiguous && match.alternatives.length
    ? ` Em đang hiểu anh/chị hỏi phim ${movie.title}; ngoài ra còn có ${match.alternatives.map(item => item.title).join(", ")}.`
    : "";
  return `Diễn viên phim ${movie.title}: ${actors.join(", ")}.${clarification}`;
}

async function getHotMovieTodayAnswer() {
  const { start, end } = dayRangeVN();
  const [bookings, payments, showtimes] = await Promise.all([
    QuickBooking.find({
      status: "paid",
      createdAt: { $gte: start, $lte: end },
    }).select("movieTitle seats totalPrice").lean(),
    Payment.find({
      status: "da_thanh_toan",
      paidAt: { $gte: start, $lte: end },
    }).select("bookingData.movieTitle bookingData.seats amount").lean(),
    Showtime.find({
      status: "scheduled",
      startTime: { $gte: start, $lte: end },
    }).populate("movie", "title isHot rating").lean(),
  ]);

  const soldMap = new Map();
  const addSale = (title, seats = [], amount = 0) => {
    if (!title) return;
    const key = String(title).trim();
    const current = soldMap.get(key) || { title: key, tickets: 0, revenue: 0 };
    current.tickets += Array.isArray(seats) ? seats.length : 0;
    current.revenue += Number(amount || 0);
    soldMap.set(key, current);
  };

  bookings.forEach(item => addSale(item.movieTitle, item.seats, item.totalPrice));
  payments.forEach(item => addSale(item.bookingData?.movieTitle, item.bookingData?.seats, item.amount));

  const soldRanking = Array.from(soldMap.values())
    .sort((a, b) => b.tickets - a.tickets || b.revenue - a.revenue);
  if (soldRanking[0]?.tickets > 0) {
    const top = soldRanking[0];
    return `Hôm nay phim hot nhất là ${top.title}: đã bán ${top.tickets} vé, doanh thu ${Number(top.revenue || 0).toLocaleString("vi-VN")}đ.`;
  }

  const scheduleMap = new Map();
  showtimes.forEach(item => {
    const title = item.movie?.title;
    if (!title) return;
    const current = scheduleMap.get(title) || {
      title,
      showtimes: 0,
      isHot: Boolean(item.movie?.isHot),
      rating: Number(item.movie?.rating || 0),
    };
    current.showtimes += 1;
    current.isHot = current.isHot || Boolean(item.movie?.isHot);
    current.rating = Math.max(current.rating, Number(item.movie?.rating || 0));
    scheduleMap.set(title, current);
  });
  const scheduledRanking = Array.from(scheduleMap.values())
    .sort((a, b) => Number(b.isHot) - Number(a.isHot) || b.showtimes - a.showtimes || b.rating - a.rating);
  if (scheduledRanking[0]) {
    const top = scheduledRanking[0];
    return `Hôm nay chưa ghi nhận vé bán, nhưng phim nổi bật nhất theo lịch chiếu là ${top.title} với ${top.showtimes} suất chiếu.`;
  }

  return "Hôm nay chưa có dữ liệu để xác định phim hot nhất.";
}

async function getTodayMoviesAnswer() {
  const { start, end } = dayRangeVN();
  const rows = await Showtime.find({
    status: "scheduled",
    startTime: { $gte: start, $lte: end },
  })
    .populate("movie", "title")
    .sort({ startTime: 1 })
    .lean();
  const titles = Array.from(new Set(rows.map(row => row.movie?.title).filter(Boolean)));
  if (!titles.length) return "Hôm nay chưa có phim nào được xếp lịch chiếu.";
  return `Hôm nay có ${titles.length} phim chiếu: ${titles.join(", ")}.`;
}

async function getTodayShowtimeCountAnswer() {
  const { start, end } = dayRangeVN();
  const count = await Showtime.countDocuments({
    status: "scheduled",
    startTime: { $gte: start, $lte: end },
  });
  return `Hôm nay hệ thống có ${count} suất chiếu đang được lên lịch.`;
}

async function getUpcomingShowtimeCountAnswer() {
  const count = await Showtime.countDocuments({
    status: "scheduled",
    startTime: { $gte: new Date() },
  });
  return `Hiện có ${count} suất chiếu sắp tới.`;
}

async function getMoviesWithoutShowtimesAnswer() {
  const movieIds = await Showtime.distinct("movie");
  const movies = await Movie.find({ _id: { $nin: movieIds } })
    .select("title status")
    .sort({ title: 1 })
    .limit(12)
    .lean();
  const total = await Movie.countDocuments({ _id: { $nin: movieIds } });
  if (!total) return "Hiện không có phim nào bị thiếu suất chiếu.";
  const suffix = total > movies.length ? `\nCòn ${total - movies.length} phim khác chưa hiển thị trong danh sách ngắn này.` : "";
  return `Có ${total} phim chưa có suất chiếu:\n${formatMovieList(movies.map(movie => `${movie.title} (${movieStatusLabel(movie.status)})`))}${suffix}`;
}

async function getInactiveRoomsAnswer() {
  const rooms = await Room.find({ status: { $ne: "active" } })
    .select("name type status totalSeats")
    .sort({ name: 1 })
    .lean();
  if (!rooms.length) return "Hiện không có phòng chiếu nào đang ngừng hoạt động hoặc bảo trì.";
  return `Có ${rooms.length} phòng chiếu không hoạt động bình thường:\n${rooms.map(room => `- ${room.name}: ${room.status}, ${room.totalSeats} ghế`).join("\n")}`;
}

async function getMarkedHotMoviesAnswer() {
  const movies = await Movie.find({ isHot: true })
    .select("title status rating")
    .sort({ rating: -1, updatedAt: -1 })
    .lean();
  if (!movies.length) return "Hiện chưa có phim nào được đánh dấu hot.";
  return `Có ${movies.length} phim đang được đánh dấu hot:\n${formatMovieList(movies.map(movie => `${movie.title} (${movieStatusLabel(movie.status)}, rating ${movie.rating || 0})`))}`;
}

async function getLatestMovieAnswer() {
  const movie = await Movie.findOne({})
    .select("title status director price createdAt releaseDate")
    .sort({ createdAt: -1, updatedAt: -1 })
    .lean();
  if (!movie) return "Hiện chưa có phim nào trong hệ thống.";
  const details = [
    `Bộ phim mới thêm gần nhất là ${movie.title}.`,
    movie.createdAt ? `Thời điểm thêm: ${formatDateTimeVN(movie.createdAt)}.` : "",
    movie.status ? `Trạng thái: ${movieStatusLabel(movie.status)}.` : "",
    movie.director ? `Đạo diễn: ${movie.director}.` : "",
    movie.price != null ? `Giá vé gốc: ${formatMoney(movie.price)}.` : "",
  ].filter(Boolean);
  return details.join("\n");
}

async function getMovieStatusListAnswer(targetStatus) {
  const statusValues = targetStatus === "now"
    ? ["now_showing", "now-showing", "featured"]
    : ["coming_soon", "coming-soon"];
  const movies = await Movie.find({ status: { $in: statusValues } })
    .select("title releaseDate isHot")
    .sort(targetStatus === "now" ? { isHot: -1, title: 1 } : { releaseDate: 1, title: 1 })
    .lean();
  const label = targetStatus === "now" ? "đang chiếu" : "sắp chiếu";
  if (!movies.length) return `Hiện chưa có phim nào ở trạng thái ${label}.`;
  return `Có ${movies.length} phim ${label}:\n${formatMovieList(movies.map(movie => {
    const date = movie.releaseDate ? ` - khởi chiếu ${formatDateVN(movie.releaseDate)}` : "";
    return `${movie.title}${movie.isHot ? " - hot" : ""}${date}`;
  }))}`;
}

async function getTopRatedMovieAnswer() {
  const rows = await Review.aggregate([
    { $match: { rating: { $gt: 0 }, status: { $in: ["approved", null] } } },
    { $group: { _id: "$movie", avgRating: { $avg: "$rating" }, count: { $sum: 1 } } },
    { $sort: { avgRating: -1, count: -1 } },
    { $limit: 1 },
    { $lookup: { from: Movie.collection.name, localField: "_id", foreignField: "_id", as: "movie" } },
    { $unwind: "$movie" },
  ]);
  if (!rows.length) {
    const movie = await Movie.findOne({ rating: { $gt: 0 } }).sort({ rating: -1 }).lean();
    return movie
      ? `Phim có rating cao nhất hiện là ${movie.title}, rating ${movie.rating}/5.`
      : "Hiện chưa có đủ dữ liệu đánh giá để xác định phim cao nhất.";
  }
  const top = rows[0];
  return `Phim có đánh giá cao nhất là ${top.movie.title}, trung bình ${Number(top.avgRating || 0).toFixed(1)}/5 từ ${top.count} đánh giá.`;
}

async function getLeastBookedMovieAnswer() {
  const sales = await QuickBooking.aggregate([
    { $match: { status: "paid" } },
    { $group: { _id: "$movieTitle", tickets: { $sum: { $size: { $ifNull: ["$seats", []] } } }, revenue: { $sum: "$totalPrice" } } },
    { $sort: { tickets: 1, revenue: 1 } },
    { $limit: 1 },
  ]);
  if (!sales.length) return "Hiện chưa có dữ liệu đơn đã thanh toán để xác định phim ít người đặt vé nhất.";
  const row = sales[0];
  return `Phim ít người đặt vé nhất hiện là ${row._id}: ${row.tickets} vé, doanh thu ${formatMoney(row.revenue)}.`;
}

async function getStartingSoonShowtimesAnswer() {
  const rows = await Showtime.find({
    status: "scheduled",
    startTime: { $gte: new Date() },
  })
    .populate("movie", "title")
    .populate("room", "name")
    .sort({ startTime: 1 })
    .limit(5)
    .lean();
  if (!rows.length) return "Hiện chưa có suất chiếu nào sắp bắt đầu.";
  return `5 suất chiếu gần nhất:\n${rows.map(row => `- ${formatDateTimeVN(row.startTime)}: ${row.movie?.title || "Chưa rõ phim"} tại ${row.room?.name || "chưa rõ phòng"}`).join("\n")}`;
}

async function getCancelledShowtimesAnswer() {
  const rows = await Showtime.find({ status: "cancelled" })
    .populate("movie", "title")
    .populate("room", "name")
    .sort({ startTime: -1 })
    .limit(10)
    .lean();
  const count = await Showtime.countDocuments({ status: "cancelled" });
  if (!count) return "Hiện không có suất chiếu nào bị hủy.";
  return `Có ${count} suất chiếu đã bị hủy. Gần nhất:\n${rows.map(row => `- ${formatDateTimeVN(row.startTime)}: ${row.movie?.title || "Chưa rõ phim"} tại ${row.room?.name || "chưa rõ phòng"}`).join("\n")}`;
}

async function getMostShowtimesTodayAnswer(type = "movie") {
  const { start, end } = dayRangeVN();
  const groupField = type === "room" ? "$room" : "$movie";
  const from = type === "room" ? Room.collection.name : Movie.collection.name;
  const rows = await Showtime.aggregate([
    { $match: { status: "scheduled", startTime: { $gte: start, $lte: end } } },
    { $group: { _id: groupField, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 1 },
    { $lookup: { from, localField: "_id", foreignField: "_id", as: "item" } },
    { $unwind: "$item" },
  ]);
  if (!rows.length) return type === "room"
    ? "Hôm nay chưa có phòng nào được xếp lịch chiếu."
    : "Hôm nay chưa có phim nào được xếp lịch chiếu.";
  const top = rows[0];
  const name = top.item.title || top.item.name;
  return type === "room"
    ? `Hôm nay phòng có nhiều suất chiếu nhất là ${name} với ${top.count} suất.`
    : `Hôm nay phim có nhiều suất chiếu nhất là ${name} với ${top.count} suất.`;
}

async function getBrokenShowtimesAnswer() {
  const rows = await Showtime.find({}).populate("movie", "title").populate("room", "name").lean();
  const broken = rows.filter(row => !row.movie || !row.room);
  if (!broken.length) return "Không phát hiện suất chiếu nào bị thiếu phim hoặc phòng.";
  return `Có ${broken.length} suất chiếu bị thiếu liên kết phim hoặc phòng. Cần kiểm tra lại dữ liệu lịch chiếu trong admin.`;
}

async function getHeldSeatsAnswer() {
  const count = await BookedSeat.countDocuments({ status: "held" });
  return `Hiện có ${count} ghế đang được giữ.`;
}

async function getExpiredHeldSeatsAnswer() {
  const rows = await BookedSeat.find({ status: "held", expiresAt: { $lte: new Date() } })
    .select("showtimeId seatLabel expiresAt")
    .sort({ expiresAt: 1 })
    .limit(10)
    .lean();
  const count = await BookedSeat.countDocuments({ status: "held", expiresAt: { $lte: new Date() } });
  if (!count) return "Không có ghế nào đang bị giữ quá hạn.";
  return `Có ${count} ghế đang bị giữ quá hạn:\n${rows.map(row => `- Ghế ${row.seatLabel}, suất ${row.showtimeId}, hết hạn ${formatDateTimeVN(row.expiresAt)}`).join("\n")}`;
}

async function getShowtimeSeatAvailabilityAnswer(mode = "available") {
  const showtimes = await Showtime.find({ status: "scheduled", startTime: { $gte: new Date() } })
    .populate("movie", "title")
    .populate("room", "name totalSeats")
    .sort({ startTime: 1 })
    .limit(80)
    .lean();
  const rows = [];
  for (const showtime of showtimes) {
    const taken = await BookedSeat.countDocuments({
      showtimeId: String(showtime._id),
      status: { $in: ["held", "booked"] },
    });
    const totalSeats = Number(showtime.room?.totalSeats || 0);
    rows.push({
      movieTitle: showtime.movie?.title || "Chưa rõ phim",
      roomName: showtime.room?.name || "chưa rõ phòng",
      startTime: showtime.startTime,
      totalSeats,
      taken,
      available: Math.max(totalSeats - taken, 0),
    });
  }
  const sorted = rows.sort((a, b) => mode === "nearFull" ? a.available - b.available : b.available - a.available).slice(0, 5);
  if (!sorted.length) return "Hiện chưa có dữ liệu ghế trống cho các suất chiếu sắp tới.";
  return mode === "nearFull"
    ? `Các suất chiếu gần hết ghế nhất:\n${sorted.map(row => `- ${row.movieTitle} lúc ${formatDateTimeVN(row.startTime)} tại ${row.roomName}: còn ${row.available}/${row.totalSeats} ghế`).join("\n")}`
    : `Các suất chiếu còn nhiều ghế trống nhất:\n${sorted.map(row => `- ${row.movieTitle} lúc ${formatDateTimeVN(row.startTime)} tại ${row.roomName}: còn ${row.available}/${row.totalSeats} ghế`).join("\n")}`;
}

async function getTopBookedSeatByRoomAnswer() {
  const rows = await BookedSeat.aggregate([
    { $match: { status: "booked" } },
    { $group: { _id: { showtimeId: "$showtimeId", seatLabel: "$seatLabel" }, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);
  if (!rows.length) return "Hiện chưa có dữ liệu ghế đã đặt để xếp hạng.";
  return `Các ghế được đặt nhiều nhất theo dữ liệu hiện có:\n${rows.map(row => `- Ghế ${row._id.seatLabel}, suất ${row._id.showtimeId}: ${row.count} lượt`).join("\n")}`;
}

async function getTicketsSoldTodayAnswer() {
  const { start, end } = dayRangeVN();
  const rows = await QuickBooking.find({
    status: "paid",
    createdAt: { $gte: start, $lte: end },
  }).select("seats totalPrice").lean();
  const tickets = rows.reduce((sum, row) => sum + getSeatCount(row.seats), 0);
  const revenue = rows.reduce((sum, row) => sum + Number(row.totalPrice || 0), 0);
  return `Hôm nay đã bán ${tickets} vé từ ${rows.length} đơn đã thanh toán, doanh thu ${formatMoney(revenue)}.`;
}

async function getBookingStatusAnswer(status) {
  const count = await QuickBooking.countDocuments({ status });
  return `Có ${count} đơn ${bookingStatusLabel(status)}.`;
}

async function getExpiredOrdersAnswer() {
  const count = await Payment.countDocuments({ status: "het_han" });
  return `Có ${count} giao dịch đã hết hạn.`;
}

async function getTicketCheckinAnswer(checkedIn) {
  const { start, end } = dayRangeVN();
  const query = checkedIn
    ? { checkedIn: true, checkedInAt: { $gte: start, $lte: end } }
    : { status: "paid", checkedIn: { $ne: true } };
  const count = await QuickBooking.countDocuments(query);
  return checkedIn
    ? `Hôm nay có ${count} đơn/vé đã check-in.`
    : `Hiện có ${count} đơn đã thanh toán nhưng chưa check-in.`;
}

async function getRevenueAnswer(scope = "total") {
  const match = { status: "da_thanh_toan" };
  if (scope === "today") {
    const { start, end } = dayRangeVN();
    match.paidAt = { $gte: start, $lte: end };
  }
  if (scope === "month") {
    match.paidAt = { $gte: startOfMonthVN(new Date()) };
  }
  const rows = await Payment.aggregate([
    { $match: match },
    { $group: { _id: null, revenue: { $sum: "$amount" }, count: { $sum: 1 } } },
  ]);
  const result = rows[0] || { revenue: 0, count: 0 };
  const label = scope === "today" ? "hôm nay" : scope === "month" ? "tháng này" : "đã thanh toán";
  return `Doanh thu ${label} là ${formatMoney(result.revenue)} từ ${result.count} giao dịch thành công.`;
}

async function getPaymentProviderCountAnswer(provider) {
  const count = await Payment.countDocuments({ provider });
  return `Có ${count} giao dịch ${providerLabel(provider)} trong hệ thống.`;
}

async function getFailedPaymentsAnswer() {
  const rows = await Payment.aggregate([
    { $match: { status: { $in: ["that_bai", "da_huy", "het_han"] } } },
    { $group: { _id: "$status", count: { $sum: 1 }, amount: { $sum: "$amount" } } },
    { $sort: { count: -1 } },
  ]);
  if (!rows.length) return "Hiện không có giao dịch thất bại, bị hủy hoặc hết hạn.";
  return `Các giao dịch cần chú ý:\n${rows.map(row => `- ${paymentStatusLabel(row._id)}: ${row.count} giao dịch, tổng ${formatMoney(row.amount)}`).join("\n")}`;
}

async function getTopPaymentMethodAnswer() {
  const rows = await Payment.aggregate([
    { $group: { _id: "$provider", count: { $sum: 1 }, amount: { $sum: "$amount" } } },
    { $sort: { count: -1, amount: -1 } },
    { $limit: 1 },
  ]);
  if (!rows.length) return "Hiện chưa có dữ liệu thanh toán.";
  const top = rows[0];
  return `Phương thức thanh toán đang dùng nhiều nhất là ${providerLabel(top._id)} với ${top.count} giao dịch, tổng giá trị ${formatMoney(top.amount)}.`;
}

async function getUserCountAnswer(role) {
  const query = role ? { role } : {};
  const count = await User.countDocuments(query);
  return role === "admin" ? `Có ${count} tài khoản admin.` : `Có ${count} người dùng trong hệ thống.`;
}

async function getBlockedUsersAnswer() {
  const users = await User.find({ status: "blocked" }).select("fullName lockedReason").limit(10).lean();
  if (!users.length) return "Hiện không có tài khoản nào bị khóa.";
  return `Có ${users.length} tài khoản bị khóa:\n${users.map(user => `- ${user.fullName}${user.lockedReason ? `: ${user.lockedReason}` : ""}`).join("\n")}`;
}

async function getTopUserByBookingsAnswer(metric = "orders") {
  const rows = await QuickBooking.aggregate([
    { $match: { status: "paid", user: { $ne: null } } },
    { $group: { _id: "$user", orders: { $sum: 1 }, revenue: { $sum: "$totalPrice" } } },
    { $sort: metric === "revenue" ? { revenue: -1, orders: -1 } : { orders: -1, revenue: -1 } },
    { $limit: 1 },
    { $lookup: { from: User.collection.name, localField: "_id", foreignField: "_id", as: "user" } },
    { $unwind: "$user" },
  ]);
  if (!rows.length) return "Hiện chưa có dữ liệu người dùng đặt vé thành công.";
  const top = rows[0];
  return metric === "revenue"
    ? `Người dùng có giao dịch thành công cao nhất là ${top.user.fullName}: ${top.orders} đơn, tổng ${formatMoney(top.revenue)}.`
    : `Người dùng đặt vé nhiều nhất là ${top.user.fullName}: ${top.orders} đơn, tổng ${formatMoney(top.revenue)}.`;
}

async function getVoucherAnswer(type) {
  const now = new Date();
  if (type === "active") {
    const rows = await Voucher.find({ status: "active", startDate: { $lte: now }, endDate: { $gte: now } }).select("code discountType discountValue endDate quantity").sort({ endDate: 1 }).limit(10).lean();
    if (!rows.length) return "Hiện chưa có voucher nào còn hiệu lực.";
    return `Voucher còn hiệu lực:\n${rows.map(v => `- ${v.code}: ${v.discountType === "percent" ? `${v.discountValue}%` : formatMoney(v.discountValue)}, hết hạn ${formatDateVN(v.endDate)}, còn ${v.quantity}`).join("\n")}`;
  }
  if (type === "expiring") {
    const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const rows = await Voucher.find({ status: "active", endDate: { $gte: now, $lte: end } }).select("code endDate quantity").sort({ endDate: 1 }).lean();
    if (!rows.length) return "Không có voucher nào sắp hết hạn trong 7 ngày tới.";
    return `Voucher sắp hết hạn:\n${rows.map(v => `- ${v.code}: hết hạn ${formatDateVN(v.endDate)}, còn ${v.quantity}`).join("\n")}`;
  }
  if (type === "mostUsed") {
    const rows = await UserVoucher.aggregate([
      { $match: { status: "used" } },
      { $group: { _id: "$voucher", used: { $sum: 1 } } },
      { $sort: { used: -1 } },
      { $limit: 1 },
      { $lookup: { from: Voucher.collection.name, localField: "_id", foreignField: "_id", as: "voucher" } },
      { $unwind: "$voucher" },
    ]);
    if (!rows.length) return "Hiện chưa có voucher nào được ghi nhận là đã dùng.";
    return `Voucher được dùng nhiều nhất là ${rows[0].voucher.code}: ${rows[0].used} lượt dùng.`;
  }
  if (type === "unused") {
    const usedIds = await UserVoucher.distinct("voucher", { status: "used" });
    const rows = await Voucher.find({ _id: { $nin: usedIds } }).select("code status endDate").limit(10).lean();
    if (!rows.length) return "Hiện không có voucher nào hoàn toàn chưa được dùng.";
    return `Voucher chưa ghi nhận lượt dùng:\n${rows.map(v => `- ${v.code}: ${v.status}, hết hạn ${formatDateVN(v.endDate)}`).join("\n")}`;
  }
  const count = await UserVoucher.countDocuments({ status: "available" });
  return `Có ${count} voucher của người dùng đang ở trạng thái chưa dùng.`;
}

async function getProductAnswer(type) {
  const sort = type === "highStock" ? { stock: -1 } : { stock: 1 };
  if (type === "bestSeller") {
    const rows = await QuickBooking.aggregate([
      { $match: { status: "paid", combos: { $exists: true, $ne: [] } } },
      { $unwind: "$combos" },
      { $group: { _id: "$combos.name", quantity: { $sum: "$combos.quantity" }, revenue: { $sum: "$combos.totalPrice" } } },
      { $sort: { quantity: -1, revenue: -1 } },
      { $limit: 1 },
    ]);
    if (!rows.length) return "Hiện chưa có dữ liệu combo/sản phẩm bán kèm.";
    return `Combo/sản phẩm bán chạy nhất là ${rows[0]._id}: ${rows[0].quantity} phần, doanh thu ${formatMoney(rows[0].revenue)}.`;
  }
  if (type === "invalid") {
    const rows = await Product.find({ $or: [{ price: { $lte: 0 } }, { price: null }, { name: { $in: [null, ""] } }] }).select("name price stock").limit(10).lean();
    if (!rows.length) return "Chưa phát hiện sản phẩm nào giá bằng 0 hoặc thiếu dữ liệu cơ bản.";
    return `Có ${rows.length} sản phẩm cần kiểm tra dữ liệu:\n${rows.map(p => `- ${p.name || "Chưa có tên"}: giá ${formatMoney(p.price)}, tồn ${p.stock ?? 0}`).join("\n")}`;
  }
  const rows = await Product.find({ isActive: true }).select("name category price stock").sort(sort).limit(10).lean();
  if (!rows.length) return "Hiện chưa có dữ liệu sản phẩm.";
  return type === "highStock"
    ? `Sản phẩm tồn kho nhiều nhất:\n${rows.map(p => `- ${p.name}: ${p.stock ?? 0} phần, giá ${formatMoney(p.price)}`).join("\n")}`
    : `Sản phẩm sắp hết hàng nhất:\n${rows.map(p => `- ${p.name}: còn ${p.stock ?? 0} phần, giá ${formatMoney(p.price)}`).join("\n")}`;
}

async function getReviewAnswer(type) {
  if (type === "most") {
    const rows = await Review.aggregate([
      { $group: { _id: "$movie", count: { $sum: 1 }, avgRating: { $avg: "$rating" } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
      { $lookup: { from: Movie.collection.name, localField: "_id", foreignField: "_id", as: "movie" } },
      { $unwind: "$movie" },
    ]);
    if (!rows.length) return "Hiện chưa có dữ liệu đánh giá.";
    return `Phim có nhiều đánh giá nhất là ${rows[0].movie.title}: ${rows[0].count} đánh giá, trung bình ${Number(rows[0].avgRating || 0).toFixed(1)}/5.`;
  }
  if (type === "low") {
    const rows = await Review.aggregate([
      { $match: { rating: { $gt: 0 } } },
      { $group: { _id: "$movie", count: { $sum: 1 }, avgRating: { $avg: "$rating" } } },
      { $sort: { avgRating: 1, count: -1 } },
      { $limit: 1 },
      { $lookup: { from: Movie.collection.name, localField: "_id", foreignField: "_id", as: "movie" } },
      { $unwind: "$movie" },
    ]);
    if (!rows.length) return "Hiện chưa có dữ liệu đánh giá thấp.";
    return `Phim đang bị đánh giá thấp nhất là ${rows[0].movie.title}: trung bình ${Number(rows[0].avgRating || 0).toFixed(1)}/5 từ ${rows[0].count} đánh giá.`;
  }
  if (type === "pending") {
    const count = await Review.countDocuments({ status: "pending" });
    return `Có ${count} đánh giá đang chờ duyệt.`;
  }
  const rows = await Review.aggregate([
    { $match: { rating: { $gt: 0 } } },
    { $group: { _id: "$movie", count: { $sum: 1 }, avgRating: { $avg: "$rating" } } },
    { $sort: { avgRating: -1 } },
    { $limit: 8 },
    { $lookup: { from: Movie.collection.name, localField: "_id", foreignField: "_id", as: "movie" } },
    { $unwind: "$movie" },
  ]);
  if (!rows.length) return "Hiện chưa có dữ liệu rating trung bình theo phim.";
  return `Rating trung bình theo phim:\n${rows.map(row => `- ${row.movie.title}: ${Number(row.avgRating || 0).toFixed(1)}/5 từ ${row.count} đánh giá`).join("\n")}`;
}

async function getNewsNotificationAnswer(type) {
  if (type === "newsCount") {
    const count = await NewsEvent.countDocuments();
    return `Có ${count} tin tức và sự kiện trong hệ thống.`;
  }
  if (type === "latestNews") {
    const row = await NewsEvent.findOne({}).sort({ publishDate: -1, createdAt: -1 }).select("title category status publishDate").lean();
    return row
      ? `Tin mới nhất là ${row.title}, loại ${row.category}, trạng thái ${row.status}, ngày đăng ${formatDateVN(row.publishDate)}.`
      : "Hiện chưa có tin tức hoặc sự kiện nào.";
  }
  if (type === "recentNoti") {
    const rows = await Notification.find({}).sort({ sentAt: -1, createdAt: -1 }).select("title type target sentAt createdAt").limit(5).lean();
    if (!rows.length) return "Hiện chưa có thông báo nào.";
    return `Thông báo gần đây:\n${rows.map(row => `- ${row.title || "Không có tiêu đề"}: ${row.type}, gửi cho ${row.target}, lúc ${formatDateTimeVN(row.sentAt || row.createdAt)}`).join("\n")}`;
  }
  const count = await Notification.countDocuments({ sentAt: { $in: [null, undefined] } });
  return `Có ${count} thông báo chưa có thời điểm gửi.`;
}

async function getSystemIssuesAnswer() {
  const [
    inactiveRooms,
    pendingReviews,
    expiredPayments,
    expiredHeldSeats,
    invalidProducts,
    brokenShowtimes,
  ] = await Promise.all([
    Room.countDocuments({ status: { $ne: "active" } }),
    Review.countDocuments({ status: "pending" }),
    Payment.countDocuments({ status: "het_han" }),
    BookedSeat.countDocuments({ status: "held", expiresAt: { $lte: new Date() } }),
    Product.countDocuments({ $or: [{ price: { $lte: 0 } }, { price: null }, { name: { $in: [null, ""] } }] }),
    Showtime.find({}).populate("movie", "title").populate("room", "name").lean(),
  ]);
  const brokenCount = brokenShowtimes.filter(row => !row.movie || !row.room).length;
  const issues = [
    inactiveRooms ? `${inactiveRooms} phòng chiếu không hoạt động bình thường` : "",
    pendingReviews ? `${pendingReviews} đánh giá đang chờ duyệt` : "",
    expiredPayments ? `${expiredPayments} giao dịch hết hạn` : "",
    expiredHeldSeats ? `${expiredHeldSeats} ghế giữ quá hạn` : "",
    invalidProducts ? `${invalidProducts} sản phẩm thiếu dữ liệu hoặc giá không hợp lệ` : "",
    brokenCount ? `${brokenCount} suất chiếu thiếu liên kết phim/phòng` : "",
  ].filter(Boolean);
  return issues.length
    ? `Hôm nay nên kiểm tra trước:\n${issues.map(item => `- ${item}`).join("\n")}`
    : "Hôm nay chưa phát hiện vấn đề vận hành nổi bật trong dữ liệu.";
}

async function getIncreaseShowtimesAnswer() {
  const { start, end } = dayRangeVN();
  const rows = await QuickBooking.aggregate([
    { $match: { status: "paid", createdAt: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: "$movieTitle",
        tickets: { $sum: { $size: { $ifNull: ["$seats", []] } } },
        revenue: { $sum: "$totalPrice" },
      },
    },
    { $sort: { tickets: -1, revenue: -1 } },
    { $limit: 3 },
  ]);
  if (!rows.length) return "Chưa có dữ liệu bán vé hôm nay để đề xuất tăng suất chiếu.";
  return `Nên cân nhắc tăng suất cho phim đang bán tốt hôm nay:\n${rows.map(row => `- ${row._id}: ${row.tickets} vé, doanh thu ${formatMoney(row.revenue)}`).join("\n")}`;
}

async function getDecreaseShowtimesAnswer() {
  const { start, end } = dayRangeVN();
  const rows = await Showtime.aggregate([
    { $match: { status: "scheduled", startTime: { $gte: start, $lte: end } } },
    { $lookup: { from: Movie.collection.name, localField: "movie", foreignField: "_id", as: "movie" } },
    { $unwind: "$movie" },
    { $group: { _id: "$movie.title", showtimes: { $sum: 1 } } },
    { $sort: { showtimes: -1 } },
  ]);
  const sales = await QuickBooking.aggregate([
    { $match: { status: "paid", createdAt: { $gte: start, $lte: end } } },
    { $group: { _id: "$movieTitle", tickets: { $sum: { $size: { $ifNull: ["$seats", []] } } } } },
  ]);
  const salesMap = new Map(sales.map(row => [row._id, row.tickets]));
  const candidates = rows
    .map(row => ({ ...row, tickets: salesMap.get(row._id) || 0 }))
    .sort((a, b) => a.tickets - b.tickets || b.showtimes - a.showtimes)
    .slice(0, 3);
  if (!candidates.length) return "Chưa có dữ liệu lịch chiếu hôm nay để đề xuất giảm suất.";
  return `Có thể cân nhắc giảm hoặc theo dõi các phim có ít vé bán hôm nay:\n${candidates.map(row => `- ${row._id}: ${row.showtimes} suất, ${row.tickets} vé bán`).join("\n")}`;
}

async function getAdminSummaryAnswer() {
  const [
    movies,
    todayShowtimes,
    revenue,
    paidOrders,
    heldSeats,
    pendingReviews,
  ] = await Promise.all([
    Movie.countDocuments(),
    Showtime.countDocuments({ status: "scheduled", startTime: { $gte: dayRangeVN().start, $lte: dayRangeVN().end } }),
    Payment.aggregate([{ $match: { status: "da_thanh_toan", paidAt: { $gte: dayRangeVN().start, $lte: dayRangeVN().end } } }, { $group: { _id: null, revenue: { $sum: "$amount" }, count: { $sum: 1 } } }]),
    QuickBooking.countDocuments({ status: "paid", createdAt: { $gte: dayRangeVN().start, $lte: dayRangeVN().end } }),
    BookedSeat.countDocuments({ status: "held" }),
    Review.countDocuments({ status: "pending" }),
  ]);
  const rev = revenue[0] || { revenue: 0, count: 0 };
  return `Tóm tắt hôm nay: hệ thống có ${movies} phim, ${todayShowtimes} suất chiếu trong ngày, ${paidOrders} đơn đã thanh toán, doanh thu ${formatMoney(rev.revenue)} từ ${rev.count} giao dịch, ${heldSeats} ghế đang giữ và ${pendingReviews} đánh giá chờ duyệt.`;
}

function formatMovieInfo(movie) {
  const actors = getMovieActors(movie);
  const language = getMovieValue(movie, MOVIE_LANGUAGE_FIELDS);
  const parts = [
    `Phim: ${movie.title}`,
    movie.status ? `Trạng thái: ${movieStatusLabel(movie.status)}` : null,
    movie.genre ? `Thể loại: ${Array.isArray(movie.genre) ? movie.genre.join(", ") : movie.genre}` : null,
    movie.duration ? `Thời lượng: ${movie.duration}` : null,
    language ? `Ngôn ngữ: ${Array.isArray(language) ? language.join(", ") : language}` : null,
    movie.director ? `Đạo diễn: ${movie.director}` : null,
    actors.length ? `Diễn viên: ${actors.join(", ")}` : "Hiện phim này chưa có thông tin diễn viên trong hệ thống.",
    movie.releaseDate ? `Ngày khởi chiếu: ${new Date(movie.releaseDate).toLocaleDateString("vi-VN")}` : null,
    movie.price != null ? `Giá vé gốc: ${Number(movie.price).toLocaleString("vi-VN")}đ` : null,
    movie.rating != null ? `Đánh giá: ${Number(movie.rating)}/5` : null,
  ].filter(Boolean);
  if (movie.description || movie.synopsis) {
    parts.push(`Mô tả: ${String(movie.description || movie.synopsis).slice(0, 260)}`);
  }
  return parts.join("\n");
}

async function getMovieInfoAnswer(question = "") {
  const match = await findMovieMatchForQuestion(question);
  const movie = match?.movie;
  if (!movie) return "Em chưa tìm thấy phim này trong dữ liệu.";

  const showtimes = await Showtime.find({
    movie: movie._id,
    status: "scheduled",
    startTime: { $gte: new Date() },
  })
    .populate("room", "name")
    .sort({ startTime: 1 })
    .limit(3)
    .lean();
  const schedule = showtimes.length
    ? `Lịch chiếu sắp tới: ${showtimes.map(item => `${formatDateTimeVN(item.startTime)}${item.room?.name ? ` tại ${item.room.name}` : ""}, ${formatMoney(item.price)}`).join("; ")}.`
    : "Lịch chiếu: hiện chưa có suất chiếu sắp tới.";
  const clarification = match.ambiguous && match.alternatives.length
    ? `\nEm đang hiểu anh/chị hỏi phim ${movie.title}; các tên gần khớp khác là ${match.alternatives.map(item => item.title).join(", ")}.`
    : "";
  return `${formatMovieInfo(movie)}\n${schedule}${clarification}`;
}

async function buildLocalFallbackAnswer(question, context, reason = "") {
  const normalized = question.toLowerCase();
  const snapshot = context.businessSnapshot || {};
  const movies = findCollection(context, "movies");
  const showtimes = findCollection(context, "showtimes");
  const payments = findCollection(context, "payments");
  const users = findCollection(context, "users");
  const quickBookings = findCollection(context, "quickBookings");
  const products = findCollection(context, "products");
  const reviews = findCollection(context, "reviews");
  const prefix = reason ? `Lưu ý: ${reason}, em dùng dữ liệu nội bộ để trả lời.\n` : "";

  if (normalized.includes("suất") || normalized.includes("lich") || normalized.includes("lịch")) {
    return `${prefix}Hiện có ${snapshot.upcomingScheduledShowtimes || 0} suất chiếu sắp tới đang bán/lên lịch.`;
  }

  if (normalized.includes("doanh thu") || normalized.includes("thanh toán") || normalized.includes("payment")) {
    const asksThisMonth = normalized.includes("tháng này") || normalized.includes("thang nay");
    const paid = asksThisMonth ? (snapshot.monthRevenue || {}) : (snapshot.paidRevenue || {});
    const pending = (snapshot.paymentStatus || [])
      .filter(row => row._id?.status === "cho_thanh_toan")
      .reduce((sum, row) => sum + Number(row.count || 0), 0);
    if (asksThisMonth) {
      return `${prefix}Doanh thu tháng này là ${Number(paid.revenue || 0).toLocaleString("vi-VN")}đ từ ${paid.count || 0} giao dịch thành công.`;
    }
    return `${prefix}Thanh toán thành công hiện là ${Number(paid.revenue || 0).toLocaleString("vi-VN")}đ từ ${paid.count || 0} giao dịch. Giao dịch đang chờ: ${pending}.`;
  }

  if (normalized.includes("phim") || normalized.includes("bán")) {
    const matchedMovie = await findMovieForQuestion(question);
    if (matchedMovie) {
      return `${prefix}${await getMovieInfoAnswer(question)}`;
    }
    const movieStatuses = (snapshot.movieStatus || [])
      .map(row => `${row._id || "unknown"}: ${row.count || 0}`)
      .join(", ");
    return `${prefix}Hệ thống có ${movies.count || 0} phim. Theo trạng thái: ${movieStatuses || "chưa có dữ liệu trạng thái"}.`;
  }

  if (normalized.includes("bảng") || normalized.includes("dữ liệu")) {
    const top = context.collections
      .slice()
      .sort((a, b) => Number(b.count || 0) - Number(a.count || 0))
      .slice(0, 5)
      .map(item => `${item.label}: ${Number(item.count || 0).toLocaleString("vi-VN")}`)
      .join("\n");
    return `${prefix}Snapshot có ${context.collections.length} bảng/model, tổng ${context.collections.reduce((sum, item) => sum + Number(item.count || 0), 0).toLocaleString("vi-VN")} bản ghi.\n${top}`;
  }

  return `${prefix}Em chưa đủ dữ liệu để trả lời chính xác câu này. Snapshot nhanh: ${movies.count || 0} phim, ${showtimes.count || 0} suất chiếu, ${payments.count || 0} thanh toán, ${users.count || 0} người dùng.`;
}

async function answerDirectQuestion(question, context) {
  const normalized = normalizeText(question);
  const snapshot = context?.businessSnapshot || {};

  if (normalized.includes("tom tat tinh hinh") || normalized.includes("tong quan hom nay")) {
    return getAdminSummaryAnswer();
  }
  if (normalized.includes("van de") || normalized.includes("kiem tra truoc") || normalized.includes("bat thuong") || normalized.includes("can kiem tra")) {
    return getSystemIssuesAnswer();
  }

  if ((normalized.includes("hot") || normalized.includes("nổi bật") || normalized.includes("noi bat")) &&
      normalized.includes("hom nay") &&
      (normalized.includes("phim") || normalized.includes("film"))) {
    return getHotMovieTodayAnswer();
  }
  const asksTodayMovies = normalized.includes("hom nay")
    && (normalized.includes("phim") || normalized.includes("film"))
    && normalized.includes("chieu");
  if (asksTodayMovies) {
    return getTodayMoviesAnswer();
  }

  const asksMovieActors = normalized.includes("dien vien")
    || normalized.includes("dan cast")
    || normalized.includes("ai tham gia")
    || normalized.includes("nhung ai tham gia");
  const asksMovieInfo = normalized.includes("thong tin") && normalized.includes("phim");
  const asksMovieDirector = normalized.includes("dao dien");

  if (asksMovieActors) {
    return getMovieActorsAnswer(question);
  }
  if (asksMovieDirector) {
    return getMovieDirectorAnswer(question);
  }
  if (normalized.includes("lich chieu") && (normalized.includes("phim") || normalized.includes("film"))) {
    return getMovieScheduleAnswer(question);
  }
  if (asksMovieInfo) {
    return getMovieInfoAnswer(question);
  }
  if ((normalized.includes("gia") || normalized.includes("gia ve")) &&
      (normalized.includes("phim") || normalized.includes("film"))) {
    const matchedMovie = await findMovieForQuestion(question);
    if (matchedMovie) {
      return `Phim ${matchedMovie.title} có giá vé gốc ${formatMoney(matchedMovie.price)}.`;
    }
    return "Em chưa tìm thấy phim này trong dữ liệu.";
  }

  if (normalized.includes("tong bao nhieu") && (normalized.includes("bo phim") || normalized.includes("phim"))) {
    const count = await Movie.countDocuments();
    return `Hệ thống hiện có tổng cộng ${count} bộ phim.`;
  }
  if (
    (normalized.includes("phim") || normalized.includes("film") || normalized.includes("bo phim")) &&
    (normalized.includes("moi them gan nhat") || normalized.includes("them gan nhat") || normalized.includes("moi nhat") || normalized.includes("vua them"))
  ) {
    return getLatestMovieAnswer();
  }
  if (normalized.includes("phim nao dang chieu")) {
    return getMovieStatusListAnswer("now");
  }
  if (normalized.includes("phim nao sap chieu")) {
    return getMovieStatusListAnswer("soon");
  }
  if (normalized.includes("danh dau hot")) {
    return getMarkedHotMoviesAnswer();
  }
  if (normalized.includes("danh gia cao nhat")) {
    return getTopRatedMovieAnswer();
  }
  if (normalized.includes("it nguoi dat ve") || normalized.includes("it dat ve")) {
    return getLeastBookedMovieAnswer();
  }
  if (normalized.includes("phim nao chua co suat chieu") || normalized.includes("co phim nao chua co suat chieu")) {
    return getMoviesWithoutShowtimesAnswer();
  }

  if (normalized.includes("hom nay he thong co bao nhieu suat chieu") || normalized.includes("hom nay co bao nhieu suat chieu")) {
    return getTodayShowtimeCountAnswer();
  }
  if (normalized.includes("suat chieu sap toi") || normalized.includes("bao nhieu suat chieu sap toi")) {
    return getUpcomingShowtimeCountAnswer();
  }
  if (normalized.includes("suat chieu nao sap bat dau")) {
    return getStartingSoonShowtimesAnswer();
  }
  if (normalized.includes("suat chieu nao da bi huy") || normalized.includes("suat chieu bi huy")) {
    return getCancelledShowtimesAnswer();
  }
  if (normalized.includes("phim nao co nhieu suat chieu")) {
    return getMostShowtimesTodayAnswer("movie");
  }
  if (normalized.includes("phong nao co nhieu suat chieu")) {
    return getMostShowtimesTodayAnswer("room");
  }
  if (normalized.includes("suat chieu nao chua gan phim") || normalized.includes("thieu phim hoac phong")) {
    return getBrokenShowtimesAnswer();
  }
  if (normalized.includes("phong chieu nao dang khong hoat dong") || normalized.includes("phong nao dang khong hoat dong")) {
    return getInactiveRoomsAnswer();
  }

  if (normalized.includes("bao nhieu ghe dang duoc giu") || normalized.includes("ghe dang duoc giu")) {
    return getHeldSeatsAnswer();
  }
  if (normalized.includes("ghe nao giu qua lau") || normalized.includes("giu qua lau")) {
    return getExpiredHeldSeatsAnswer();
  }
  if (normalized.includes("con nhieu ghe trong")) {
    return getShowtimeSeatAvailabilityAnswer("available");
  }
  if (normalized.includes("gan het ghe")) {
    return getShowtimeSeatAvailabilityAnswer("nearFull");
  }
  if (normalized.includes("ghe nao da dat nhieu nhat")) {
    return getTopBookedSeatByRoomAnswer();
  }

  if (normalized.includes("hom nay ban duoc bao nhieu ve")) {
    return getTicketsSoldTodayAnswer();
  }
  if (normalized.includes("don da thanh toan")) {
    return getBookingStatusAnswer("paid");
  }
  if (normalized.includes("don dang cho thanh toan") || normalized.includes("don cho thanh toan")) {
    return getBookingStatusAnswer("pending");
  }
  if (normalized.includes("don nao bi het han") || normalized.includes("don het han")) {
    return getExpiredOrdersAnswer();
  }
  if (normalized.includes("ve nao chua check-in") || normalized.includes("ve nao chua checkin")) {
    return getTicketCheckinAnswer(false);
  }
  if (normalized.includes("ve nao da check-in") || normalized.includes("ve nao da checkin")) {
    return getTicketCheckinAnswer(true);
  }

  if (normalized.includes("doanh thu hom nay so voi thang nay")) {
    const [today, month] = await Promise.all([getRevenueAnswer("today"), getRevenueAnswer("month")]);
    return `${today}\n${month}`;
  }
  if (normalized.includes("doanh thu hom nay")) {
    return getRevenueAnswer("today");
  }
  if (normalized.includes("doanh thu thang nay")) {
    return getRevenueAnswer("month");
  }
  if (normalized.includes("tong doanh thu da thanh toan") || normalized.includes("tong doanh thu")) {
    return getRevenueAnswer("total");
  }
  if (normalized.includes("bao nhieu giao dich payos")) {
    return getPaymentProviderCountAnswer("payos");
  }
  if (normalized.includes("bao nhieu giao dich vnpay")) {
    return getPaymentProviderCountAnswer("vnpay");
  }
  if (normalized.includes("giao dich nao that bai") || normalized.includes("giao dich that bai") || normalized.includes("bi huy")) {
    return getFailedPaymentsAnswer();
  }
  if (normalized.includes("phuong thuc thanh toan nao")) {
    return getTopPaymentMethodAnswer();
  }
  if (normalized.includes("bao nhieu nguoi dung")) {
    return getUserCountAnswer();
  }
  if (normalized.includes("bao nhieu admin")) {
    return getUserCountAnswer("admin");
  }
  if (normalized.includes("user nao dat ve nhieu nhat")) {
    return getTopUserByBookingsAnswer("orders");
  }
  if (normalized.includes("user nao co nhieu giao dich thanh cong")) {
    return getTopUserByBookingsAnswer("revenue");
  }
  if (normalized.includes("tai khoan nao bi khoa")) {
    return getBlockedUsersAnswer();
  }

  if (normalized.includes("voucher nao con hieu luc")) return getVoucherAnswer("active");
  if (normalized.includes("voucher nao sap het han")) return getVoucherAnswer("expiring");
  if (normalized.includes("voucher nao duoc dung nhieu nhat")) return getVoucherAnswer("mostUsed");
  if (normalized.includes("voucher nao chua ai dung")) return getVoucherAnswer("unused");
  if (normalized.includes("user nao dang co voucher chua dung")) return getVoucherAnswer("userAvailable");
  if (normalized.includes("voucher nao nen tat") || normalized.includes("voucher nao nen gia han")) return getVoucherAnswer("expiring");

  if (normalized.includes("san pham nao sap het hang")) return getProductAnswer("lowStock");
  if (normalized.includes("san pham nao con ton kho nhieu")) return getProductAnswer("highStock");
  if (normalized.includes("combo nao ban chay nhat")) return getProductAnswer("bestSeller");
  if (normalized.includes("san pham nao gia bang 0") || normalized.includes("thieu du lieu")) return getProductAnswer("invalid");

  if (normalized.includes("phim nao co nhieu danh gia nhat")) return getReviewAnswer("most");
  if (normalized.includes("phim nao bi danh gia thap")) return getReviewAnswer("low");
  if (normalized.includes("danh gia nao can duyet") || normalized.includes("danh gia dang cho duyet")) return getReviewAnswer("pending");
  if (normalized.includes("trung binh rating")) return getReviewAnswer("average");

  if (normalized.includes("bao nhieu tin tuc") || normalized.includes("bao nhieu su kien")) return getNewsNotificationAnswer("newsCount");
  if (normalized.includes("tin nao moi nhat")) return getNewsNotificationAnswer("latestNews");
  if (normalized.includes("thong bao nao da gui gan day")) return getNewsNotificationAnswer("recentNoti");
  if (normalized.includes("thong bao nao dang cho gui")) return getNewsNotificationAnswer("pendingNoti");

  if (normalized.includes("phim nao nen tang suat chieu")) {
    return getIncreaseShowtimesAnswer();
  }
  if (normalized.includes("phim nao nen giam suat chieu")) {
    return getDecreaseShowtimesAnswer();
  }
  return "";
}

function getOpenAiFriendlyError(error) {
  if (error?.code === "credit_balance_exhausted" || error?.type === "insufficient_quota") {
    return "OpenAI API key đã hết credits";
  }
  if (error?.status === 429) return "OpenAI đang giới hạn quota/rate limit";
  if (error?.status === 401) return "OpenAI API key không hợp lệ hoặc đã bị thu hồi";
  if (error?.status >= 500) return "OpenAI tạm thời lỗi phía máy chủ";
  return error?.message || "Không gọi được OpenAI";
}

function getGeminiFriendlyError(error) {
  const message = error?.message || "";
  if (error?.status === 400 || /api key not valid|invalid/i.test(message)) {
    return "Gemini API key không hợp lệ";
  }
  if (error?.status === 403 || /permission|forbidden/i.test(message)) {
    return "Gemini API key chưa có quyền gọi model này";
  }
  if (error?.status === 429 || /quota|rate/i.test(message)) {
    return "Gemini API đang hết quota hoặc bị giới hạn tốc độ";
  }
  return message || "Không gọi được Gemini";
}

async function callGemini({ systemPrompt, context, history, question }) {
  const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  let lastError;
  for (const model of getGeminiModelCandidates()) {
    try {
      const response = await client.models.generateContent({
        model,
        contents: [{
          role: "user",
          parts: [{
            text: [
              systemPrompt,
              "",
              "CONTEXT JSON:",
              JSON.stringify({ context, recentConversation: history, adminQuestion: question }),
            ].join("\n"),
          }],
        }],
        config: {
          temperature: 0.2,
          maxOutputTokens: 260,
        },
      });
      return { text: cleanAiAnswer(response.text || ""), model };
    } catch (error) {
      lastError = error;
      if (!(error?.status === 404 || /not_found|no longer available|not found/i.test(error?.message || ""))) {
        throw error;
      }
    }
  }
  throw lastError;
}

async function callOpenAi({ systemPrompt, context, history, question }) {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.responses.create({
    model: getModelName(),
    temperature: 0.2,
    max_output_tokens: 260,
    input: [
      {
        role: "system",
        content: [{ type: "input_text", text: systemPrompt }],
      },
      {
        role: "user",
        content: [{
          type: "input_text",
          text: JSON.stringify({
            context,
            recentConversation: history,
            adminQuestion: question,
          }),
        }],
      },
    ],
  });
  return cleanAiAnswer(extractOutputText(response) || "");
}

const chatWithAdminAi = async (req, res, next) => {
  try {
    const question = String(req.body?.message || "").trim();
    const history = Array.isArray(req.body?.history) ? req.body.history.slice(-8) : [];

    if (!question) {
      return res.status(400).json({ success: false, message: "Vui lòng nhập câu hỏi cho AI." });
    }

    const directAnswer = await answerDirectQuestion(question);
    if (directAnswer) {
      return res.json({
        success: true,
        data: {
          answer: directAnswer,
          model: "mongo-direct",
          provider: "mongodb",
          context: {
            collectionCount: MODEL_REGISTRY.length,
            generatedAt: new Date().toISOString(),
            piiExposed: shouldExposePii(),
          },
        },
      });
    }

    const provider = getAiProvider();
    if (provider === "openai" && !process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        success: false,
        message: "Chưa cấu hình OPENAI_API_KEY trong backend/.env.",
      });
    }
    if (provider === "gemini" && !process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        success: false,
        message: "Chưa cấu hình GEMINI_API_KEY trong backend/.env.",
      });
    }

    const context = await buildAdminContext();

    const systemPrompt = [
      "Bạn là FilmGo AI Assistant, trợ lý nội bộ chính thức cho đội ngũ quản trị hệ thống FilmGo.",
      "",
      "CÁCH NÓI:",
      "- Nói như một nhân viên vận hành đang trả lời admin, tự nhiên và dễ hiểu.",
      "- Xưng là \"em\", gọi người dùng là \"anh/chị\".",
      "- Trả lời thẳng vào câu hỏi, không vòng vo.",
      "- Không dùng markdown, không dùng ký tự **, ###, bảng, code block hoặc backtick.",
      "- Không nhắc tên field kỹ thuật như businessSnapshot, collection, payments, quickBookings, showtimes, trừ khi người dùng hỏi kỹ thuật.",
      "- Câu hỏi đơn giản thì trả lời 1 câu. Câu hỏi số liệu thì nêu con số chính trước.",
      "- Không thêm khuyến nghị, cảnh báo, giải thích dài nếu người dùng không hỏi.",
      "",
      "NGUỒN DỮ LIỆU VÀ ĐỘ TIN CẬY:",
      "- Chỉ được trả lời dựa trên CONTEXT hệ thống được cung cấp trong request hiện tại.",
      "- Không tự bịa số liệu, tên bảng, trạng thái, phim, người dùng, doanh thu, lỗi hoặc nguyên nhân.",
      "- Nếu dữ liệu không đủ, nói ngắn gọn: \"Em chưa đủ dữ liệu để kết luận.\"",
      "",
      "PHẠM VI HỖ TRỢ:",
      "- Có thể hỗ trợ phân tích vận hành rạp, phim, suất chiếu, ghế, đơn đặt vé, thanh toán, voucher, sản phẩm/combo, đánh giá, thông báo, tin tức và người dùng.",
      "",
      "BẢO MẬT VÀ QUYỀN RIÊNG TƯ:",
      "- Tuyệt đối không tiết lộ password, token, secret, hash, API key hoặc thông tin nhạy cảm đã bị che.",
      "- Không hướng dẫn thao tác phá hoại, vượt quyền, xóa dữ liệu hàng loạt hoặc né kiểm soát bảo mật.",
      "",
      "VÍ DỤ PHONG CÁCH:",
      "Người dùng hỏi: Hôm nay có bao nhiêu suất chiếu?",
      "Trả lời: Hôm nay đang có 42 suất chiếu sắp tới.",
      "Người dùng hỏi: Doanh thu tháng này là bao nhiêu?",
      "Trả lời: Doanh thu tháng này là 10.716.700đ từ 35 đơn đã thanh toán.",
    ].join("\n");

    let answer = "";
    let usedModel = "";
    try {
      if (provider === "gemini") {
        const geminiResult = await callGemini({ systemPrompt, context, history, question });
        answer = geminiResult.text;
        usedModel = geminiResult.model;
      } else if (provider === "openai") {
        answer = await callOpenAi({ systemPrompt, context, history, question });
        usedModel = getModelName();
      } else {
        answer = await buildLocalFallbackAnswer(question, context, "Chưa cấu hình AI provider");
        usedModel = "local-fallback";
      }
      if (looksLikeTechnicalLeak(answer)) {
        answer = await buildLocalFallbackAnswer(question, context);
        usedModel = "local-cleanup";
      }
    } catch (providerError) {
      const friendlyError = provider === "gemini"
        ? getGeminiFriendlyError(providerError)
        : getOpenAiFriendlyError(providerError);
      return res.status(200).json({
        success: true,
        data: {
          answer: await buildLocalFallbackAnswer(question, context, friendlyError),
          model: "local-fallback",
          providerError: friendlyError,
          context: {
            collectionCount: context.collections.length,
            generatedAt: context.businessSnapshot.generatedAt,
            piiExposed: shouldExposePii(),
          },
        },
      });
    }

    return res.json({
      success: true,
      data: {
        answer: answer || "AI chưa trả về nội dung.",
        model: usedModel || (provider === "gemini" ? getGeminiModelName() : provider === "openai" ? getModelName() : "local-fallback"),
        provider,
        context: {
          collectionCount: context.collections.length,
          generatedAt: context.businessSnapshot.generatedAt,
          piiExposed: shouldExposePii(),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const getAdminAiContextSummary = async (req, res, next) => {
  try {
    const context = await buildAdminContext();
    return res.json({
      success: true,
      data: {
        collections: context.collections.map(item => ({
          key: item.key,
          label: item.label,
          collection: item.collection,
          count: item.count,
          fields: item.schema.map(field => field.field),
        })),
        businessSnapshot: context.businessSnapshot,
        piiExposed: shouldExposePii(),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  chatWithAdminAi,
  getAdminAiContextSummary,
};
