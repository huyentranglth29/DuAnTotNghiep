const { GoogleGenAI } = require("@google/genai");

const Movie = require("../models/Movie");
const Showtime = require("../models/Showtime");
const Voucher = require("../models/Voucher");
const Product = require("../models/Product");
const NewsEvent = require("../models/NewsEvent");
const QuickBooking = require("../models/QuickBooking");
const Payment = require("../models/Payment");

function normalizeText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

function escapeRegex(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
  });
}

function movieStatusLabel(status = "") {
  const map = {
    now_showing: "đang chiếu",
    "now-showing": "đang chiếu",
    coming_soon: "sắp chiếu",
    "coming-soon": "sắp chiếu",
    featured: "đang chiếu",
    ended: "đã kết thúc",
    stopped: "tạm dừng",
  };
  return map[status] || status || "chưa cập nhật";
}

function cleanAiAnswer(text = "") {
  return String(text)
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractMovieQuery(question = "") {
  return String(question)
    .replace(/\b(cho|toi|tôi|xin|hoi|hỏi|ve|về|phim|film|movie|lich|lịch|chieu|chiếu|gia|giá|dao dien|đạo diễn|dien vien|diễn viên|bao nhieu|bao nhiêu|la ai|là ai|thong tin|thông tin|cua|của)\b/gi, " ")
    .replace(/[?!.:,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function findMovie(question = "") {
  const rawKeyword = extractMovieQuery(question);
  const normalizedKeyword = normalizeText(rawKeyword);
  const movies = await Movie.find({}).lean();
  const direct = movies.find(movie => {
    const title = normalizeText(movie.title);
    return title && (normalizeText(question).includes(title) || normalizedKeyword.includes(title));
  });
  if (direct) return direct;
  if (rawKeyword.length >= 2) {
    return Movie.findOne({ title: { $regex: escapeRegex(rawKeyword), $options: "i" } }).lean();
  }
  return null;
}

async function buildPublicSnapshot() {
  const now = new Date();
  const { start, end } = dayRangeVN(now);
  const [
    movies,
    todayShowtimes,
    upcomingShowtimes,
    vouchers,
    products,
    news,
  ] = await Promise.all([
    Movie.find({})
      .select("title synopsis description duration genre director cast releaseDate status rating ageRating isHot price")
      .sort({ isHot: -1, updatedAt: -1 })
      .limit(30)
      .lean(),
    Showtime.find({ status: "scheduled", startTime: { $gte: start, $lte: end } })
      .populate("movie", "title")
      .populate("room", "name type")
      .sort({ startTime: 1 })
      .limit(50)
      .lean(),
    Showtime.find({ status: "scheduled", startTime: { $gte: now } })
      .populate("movie", "title")
      .populate("room", "name type")
      .sort({ startTime: 1 })
      .limit(50)
      .lean(),
    Voucher.find({ status: "active", startDate: { $lte: now }, endDate: { $gte: now } })
      .select("code description discountType discountValue minOrderValue maxDiscount endDate")
      .sort({ endDate: 1 })
      .limit(12)
      .lean(),
    Product.find({ isActive: true })
      .select("name price stock description category")
      .sort({ category: 1, price: 1 })
      .limit(20)
      .lean(),
    NewsEvent.find({ status: "da_dang" })
      .select("title summary category publishDate")
      .sort({ publishDate: -1, createdAt: -1 })
      .limit(8)
      .lean(),
  ]);

  return {
    generatedAt: now.toISOString(),
    cinema: "FilmGo Hà Trung (Thanh Hóa)",
    movies: movies.map(movie => ({
      title: movie.title,
      status: movieStatusLabel(movie.status),
      genre: Array.isArray(movie.genre) ? movie.genre.join(", ") : movie.genre,
      duration: movie.duration,
      director: movie.director,
      cast: Array.isArray(movie.cast) ? movie.cast.slice(0, 5).join(", ") : movie.cast,
      releaseDate: movie.releaseDate,
      ageRating: movie.ageRating,
      rating: movie.rating,
      isHot: movie.isHot,
      price: movie.price,
      synopsis: movie.synopsis || movie.description,
    })),
    todayShowtimes: todayShowtimes.map(item => ({
      movie: item.movie?.title,
      room: item.room?.name,
      roomType: item.room?.type,
      startTime: item.startTime,
      price: item.price,
    })),
    upcomingShowtimes: upcomingShowtimes.map(item => ({
      movie: item.movie?.title,
      room: item.room?.name,
      roomType: item.room?.type,
      startTime: item.startTime,
      price: item.price,
    })),
    vouchers: vouchers.map(item => ({
      code: item.code,
      description: item.description,
      value: item.discountType === "percent"
        ? `${item.discountValue}%${item.maxDiscount ? `, tối đa ${formatMoney(item.maxDiscount)}` : ""}`
        : formatMoney(item.discountValue),
      minOrder: formatMoney(item.minOrderValue),
      endDate: item.endDate,
    })),
    products: products.map(item => ({
      name: item.name,
      price: item.price,
      stock: item.stock,
      description: item.description,
      category: item.category,
    })),
    news,
  };
}

async function answerDirect(question = "") {
  const normalized = normalizeText(question);
  const now = new Date();

  if (/(hot|noi bat|phim nao dang hot|phim nao hot)/.test(normalized)) {
    const { start, end } = dayRangeVN(now);
    const [bookings, payments] = await Promise.all([
      QuickBooking.find({ status: "paid", createdAt: { $gte: start, $lte: end } })
        .select("movieTitle seats totalPrice")
        .lean(),
      Payment.find({ status: "da_thanh_toan", paidAt: { $gte: start, $lte: end } })
        .select("bookingData.movieTitle bookingData.seats amount")
        .lean(),
    ]);
    const map = new Map();
    const add = (title, seats, amount) => {
      if (!title) return;
      const row = map.get(title) || { title, tickets: 0, revenue: 0 };
      row.tickets += Array.isArray(seats) ? seats.length : 0;
      row.revenue += Number(amount || 0);
      map.set(title, row);
    };
    bookings.forEach(item => add(item.movieTitle, item.seats, item.totalPrice));
    payments.forEach(item => add(item.bookingData?.movieTitle, item.bookingData?.seats, item.amount));
    const top = Array.from(map.values()).sort((a, b) => b.tickets - a.tickets || b.revenue - a.revenue)[0];
    if (top?.tickets) {
      return `Hôm nay phim đang hot nhất là ${top.title}. Phim này đã bán ${top.tickets} vé, doanh thu ${formatMoney(top.revenue)}.`;
    }
    const movie = await Movie.findOne({ $or: [{ isHot: true }, { status: "featured" }] })
      .sort({ rating: -1, updatedAt: -1 })
      .lean();
    return movie
      ? `Hôm nay chưa có đủ dữ liệu vé bán để xếp hạng. Phim đang được FilmGo đánh dấu nổi bật là ${movie.title}.`
      : "Hôm nay chưa có đủ dữ liệu để xác định phim hot nhất.";
  }

  if (/(hom nay|today).*(phim|chieu)|phim.*(hom nay|today)/.test(normalized)) {
    const { start, end } = dayRangeVN(now);
    const rows = await Showtime.find({ status: "scheduled", startTime: { $gte: start, $lte: end } })
      .populate("movie", "title")
      .sort({ startTime: 1 })
      .lean();
    const titles = Array.from(new Set(rows.map(item => item.movie?.title).filter(Boolean)));
    return titles.length
      ? `Hôm nay FilmGo có ${titles.length} phim đang chiếu: ${titles.join(", ")}.`
      : "Hôm nay FilmGo chưa có phim nào được xếp lịch chiếu.";
  }

  if (/(lich chieu|suat chieu|gio chieu)/.test(normalized)) {
    const movie = await findMovie(question);
    const filter = { status: "scheduled", startTime: { $gte: now } };
    if (movie) filter.movie = movie._id;
    const rows = await Showtime.find(filter)
      .populate("movie", "title")
      .populate("room", "name type")
      .sort({ startTime: 1 })
      .limit(8)
      .lean();
    if (!rows.length) {
      return movie
        ? `Phim ${movie.title} hiện chưa có suất chiếu sắp tới.`
        : "Hiện chưa có suất chiếu sắp tới.";
    }
    return `${movie ? `Lịch chiếu sắp tới của ${movie.title}` : "Một số suất chiếu sắp tới"}:\n${rows.map(item => `- ${formatDateTimeVN(item.startTime)}: ${item.movie?.title || movie?.title} tại ${item.room?.name || "phòng chiếu"}, giá ${formatMoney(item.price)}`).join("\n")}`;
  }

  if (/(gia ve|gia phim|bao nhieu tien|bao nhieu|price)/.test(normalized)) {
    const movie = await findMovie(question);
    if (movie?.price) return `Giá vé niêm yết của phim ${movie.title} là ${formatMoney(movie.price)}. Giá thực tế có thể thay đổi theo suất chiếu và loại ghế.`;
    const rows = await Showtime.find({ status: "scheduled", startTime: { $gte: now } })
      .populate("movie", "title")
      .sort({ price: 1 })
      .limit(5)
      .lean();
    if (!rows.length) return "Hiện chưa có dữ liệu giá vé cho suất chiếu sắp tới.";
    return `Giá vé hiện có từ ${formatMoney(rows[0].price)} đến ${formatMoney(rows[rows.length - 1].price)} tùy suất chiếu và loại ghế.`;
  }

  if (/(thong tin|noi dung|dao dien|dien vien|the loai|duration|thoi luong)/.test(normalized)) {
    const movie = await findMovie(question);
    if (!movie) return "";
    const lines = [
      `${movie.title}`,
      `Thể loại: ${Array.isArray(movie.genre) ? movie.genre.join(", ") : movie.genre || "chưa cập nhật"}.`,
      `Thời lượng: ${movie.duration || "chưa cập nhật"}.`,
      `Đạo diễn: ${movie.director || "chưa cập nhật"}.`,
      movie.cast ? `Diễn viên: ${Array.isArray(movie.cast) ? movie.cast.join(", ") : movie.cast}.` : "",
      movie.ageRating ? `Độ tuổi: ${movie.ageRating}.` : "",
      movie.synopsis || movie.description ? `Nội dung: ${movie.synopsis || movie.description}` : "",
    ].filter(Boolean);
    return lines.join("\n");
  }

  if (/(voucher|ma giam|uu dai|khuyen mai)/.test(normalized)) {
    const rows = await Voucher.find({ status: "active", startDate: { $lte: now }, endDate: { $gte: now } })
      .sort({ endDate: 1 })
      .limit(5)
      .lean();
    if (!rows.length) return "Hiện FilmGo chưa có voucher còn hiệu lực.";
    return `Các voucher đang dùng được:\n${rows.map(item => {
      const value = item.discountType === "percent"
        ? `giảm ${item.discountValue}%${item.maxDiscount ? ` tối đa ${formatMoney(item.maxDiscount)}` : ""}`
        : `giảm ${formatMoney(item.discountValue)}`;
      return `- ${item.code}: ${value}, đơn từ ${formatMoney(item.minOrderValue)}, hết hạn ${formatDateTimeVN(item.endDate)}.`;
    }).join("\n")}`;
  }

  if (/(combo|bap|nuoc|san pham|do an|do uong)/.test(normalized)) {
    const rows = await Product.find({ isActive: true }).sort({ category: 1, price: 1 }).limit(8).lean();
    if (!rows.length) return "Hiện FilmGo chưa có combo hoặc sản phẩm đang bán.";
    return `Một số combo/sản phẩm đang bán:\n${rows.map(item => `- ${item.name}: ${formatMoney(item.price)}${Number(item.stock) <= 0 ? " - tạm hết hàng" : ""}`).join("\n")}`;
  }

  if (/(dat ve|mua ve|thanh toan|payos|vnpay|qr)/.test(normalized)) {
    return "Để đặt vé, anh/chị chọn phim, chọn suất chiếu, chọn ghế rồi bấm thanh toán. FilmGo hiện hỗ trợ quét QR và thanh toán VNPay trong môi trường test.";
  }

  return "";
}

function getGeminiModelCandidates() {
  return Array.from(new Set([
    process.env.GEMINI_MODEL,
    "gemini-flash-latest",
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
  ].filter(Boolean)));
}

async function callGemini({ question, history, context }) {
  const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const systemPrompt = [
    "Bạn là FilmGo AI, trợ lý chăm sóc khách hàng trong app đặt vé xem phim FilmGo.",
    "Chỉ trả lời dựa trên dữ liệu FilmGo được cung cấp. Không bịa phim, giá, lịch chiếu, voucher.",
    "Không nhắc đến MongoDB, collection, snapshot, API, JSON, backend hay dữ liệu nội bộ.",
    "Không trả lời thông tin admin, doanh thu, người dùng, thanh toán nội bộ, bảo mật hoặc cấu hình hệ thống.",
    "Xưng hô lịch sự: gọi người dùng là anh/chị, xưng là em.",
    "Trả lời ngắn, rõ, đúng trọng tâm. Nếu có danh sách, dùng gạch đầu dòng dễ đọc.",
    "Nếu không có dữ liệu, nói rõ chưa có thông tin trên hệ thống và gợi ý thao tác tiếp theo trong app.",
  ].join("\n");
  let lastError;
  for (const model of getGeminiModelCandidates()) {
    try {
      const response = await client.models.generateContent({
        model,
        contents: [{
          role: "user",
          parts: [{
            text: `${systemPrompt}\n\nDỮ LIỆU FILMGO:\n${JSON.stringify(context)}\n\nLỊCH SỬ GẦN ĐÂY:\n${JSON.stringify(history)}\n\nCÂU HỎI KHÁCH HÀNG:\n${question}`,
          }],
        }],
        config: { temperature: 0.15, maxOutputTokens: 340 },
      });
      return cleanAiAnswer(response.text || "");
    } catch (error) {
      lastError = error;
      if (!(error?.status === 404 || /not_found|no longer available|not found/i.test(error?.message || ""))) {
        throw error;
      }
    }
  }
  throw lastError;
}

function localFallback(question = "") {
  const normalized = normalizeText(question);
  if (/cam on|thank/.test(normalized)) return "Dạ không có gì anh/chị. Em luôn sẵn sàng hỗ trợ về phim, lịch chiếu, voucher và đặt vé tại FilmGo.";
  return "Em chưa có đủ dữ liệu để trả lời chính xác câu này. Anh/chị có thể hỏi về phim đang chiếu, lịch chiếu, giá vé, voucher, combo hoặc cách đặt vé.";
}

const chatWithCustomerAi = async (req, res, next) => {
  try {
    const question = String(req.body?.message || "").trim();
    const history = Array.isArray(req.body?.history) ? req.body.history.slice(-6) : [];
    if (!question) {
      return res.status(400).json({ success: false, message: "Vui lòng nhập nội dung cần hỏi." });
    }

    const directAnswer = await answerDirect(question);
    if (directAnswer) {
      return res.json({
        success: true,
        data: { answer: directAnswer, provider: "filmgo-data" },
      });
    }

    const context = await buildPublicSnapshot();
    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        success: true,
        data: { answer: localFallback(question), provider: "local-fallback" },
      });
    }

    try {
      const answer = await callGemini({ question, history, context });
      return res.json({
        success: true,
        data: { answer: answer || localFallback(question), provider: "gemini" },
      });
    } catch (error) {
      return res.json({
        success: true,
        data: { answer: localFallback(question), provider: "local-fallback" },
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = { chatWithCustomerAi };
