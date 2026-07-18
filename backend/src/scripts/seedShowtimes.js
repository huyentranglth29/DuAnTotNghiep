const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const Room = require("../models/Room");
const Movie = require("../models/Movie");
const Showtime = require("../models/Showtime");

const DEFAULT_ROOMS = [
  { name: "Phòng 1", type: "2D", totalSeats: 20, status: "active" },
  { name: "Phòng 2", type: "IMAX", totalSeats: 20, status: "active" },
];

const PRICES = [120000, 130000, 150000, 170000];
const force = process.argv.includes("--force");

function parseDurationMinutes(duration) {
  if (typeof duration === "number" && Number.isFinite(duration)) {
    return duration;
  }
  if (typeof duration !== "string") {
    return 120;
  }
  const hourMatch = duration.match(/(\d+)\s*h/i);
  const minuteMatch = duration.match(/(\d+)\s*m/i);
  const hours = hourMatch ? Number(hourMatch[1]) : 0;
  const minutes = minuteMatch ? Number(minuteMatch[1]) : 0;
  if (!hours && !minutes) {
    const asNumber = Number(duration);
    return Number.isFinite(asNumber) && asNumber > 0 ? asNumber : 120;
  }
  return hours * 60 + minutes;
}

function isBookableStatus(movieStatus) {
  return [
    "now-showing",
    "now_showing",
    "coming-soon",
    "coming_soon",
    "featured",
  ].includes(movieStatus);
}

function makeSlot(startTime, durationMin) {
  const endTime = new Date(startTime);
  endTime.setMinutes(endTime.getMinutes() + durationMin);
  return { startTime, endTime };
}

async function seedRoomsAndShowtimes() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing in backend/.env");
  }

  await mongoose.connect(process.env.MONGO_URI);

  let rooms = await Room.find();
  if (rooms.length === 0) {
    rooms = await Room.insertMany(DEFAULT_ROOMS);
    console.log(`Created ${rooms.length} rooms`);
  } else {
    console.log(`Rooms already exist: ${rooms.length}`);
  }

  const movies = await Movie.find().sort({ createdAt: 1 });
  if (movies.length === 0) {
    console.log("No movies found. Run npm run seed:movies first.");
    await mongoose.disconnect();
    return;
  }

  console.log(`Movies found: ${movies.length}`);

  if (force) {
    const deleted = await Showtime.deleteMany({});
    console.log(`Cleared old showtimes: ${deleted.deletedCount}`);
  } else {
    const existing = await Showtime.countDocuments();
    if (existing > 0) {
      console.log(
        `Showtimes already exist: ${existing}. Use --force to recreate.`
      );
      await mongoose.disconnect();
      return;
    }
  }

  const bookable = movies.filter((m) => isBookableStatus(m.status));
  const ended = movies.filter((m) => !isBookableStatus(m.status));
  const samples = [];
  let index = 0;
  const now = new Date();

  // —— Đã chiếu: mọi phim ended + vài suất quá khứ của phim đang chiếu ——
  for (const movie of ended) {
    const durationMin = parseDurationMinutes(movie.duration);
    const start = new Date(now);
    start.setDate(start.getDate() - 2);
    start.setHours(14 + (index % 3), 0, 0, 0);
    const { startTime, endTime } = makeSlot(start, durationMin);
    samples.push({
      movie: movie._id,
      room: rooms[index % rooms.length]._id,
      startTime,
      endTime,
      price: PRICES[index % PRICES.length],
      status: "completed",
    });
    index += 1;
  }

  bookable.forEach((movie, i) => {
    if (i % 3 !== 0) return;
    const durationMin = parseDurationMinutes(movie.duration);
    const start = new Date(now);
    start.setDate(start.getDate() - 1);
    start.setHours(19, 0, 0, 0);
    const { startTime, endTime } = makeSlot(start, durationMin);
    samples.push({
      movie: movie._id,
      room: rooms[index % rooms.length]._id,
      startTime,
      endTime,
      price: PRICES[index % PRICES.length],
      status: "completed",
    });
    index += 1;
  });

  // —— Đang chiếu: start ~40 phút trước, end còn ở tương lai ——
  const showingMovies = bookable.slice(0, Math.min(3, bookable.length));
  for (const movie of showingMovies) {
    const durationMin = parseDurationMinutes(movie.duration);
    const start = new Date(now.getTime() - 40 * 60 * 1000);
    const end = new Date(start.getTime() + durationMin * 60 * 1000);
    samples.push({
      movie: movie._id,
      room: rooms[index % rooms.length]._id,
      startTime: start,
      endTime: end,
      price: PRICES[index % PRICES.length],
      status: "scheduled", // UI tính "Đang chiếu" theo giờ thật
    });
    index += 1;
  }

  // —— Sắp chiếu: hôm nay/mai vài khung còn lại ——
  for (const movie of bookable) {
    const durationMin = parseDurationMinutes(movie.duration);

    // Chiều / tối hôm nay (nếu còn trong tương lai)
    for (const hour of [16, 21]) {
      const start = new Date(now);
      start.setHours(hour, 0, 0, 0);
      if (start.getTime() <= now.getTime()) continue;
      const { startTime, endTime } = makeSlot(start, durationMin);
      samples.push({
        movie: movie._id,
        room: rooms[index % rooms.length]._id,
        startTime,
        endTime,
        price: PRICES[index % PRICES.length],
        status: "scheduled",
      });
      index += 1;
    }

    // 1 suất ngày mai
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14 + (index % 2) * 5, 0, 0, 0);
    const slot = makeSlot(tomorrow, durationMin);
    samples.push({
      movie: movie._id,
      room: rooms[index % rooms.length]._id,
      startTime: slot.startTime,
      endTime: slot.endTime,
      price: PRICES[index % PRICES.length],
      status: "scheduled",
    });
    index += 1;
  }

  // —— Đã hủy: 1–2 suất mẫu ——
  if (bookable[0]) {
    const durationMin = parseDurationMinutes(bookable[0].duration);
    const start = new Date(now);
    start.setDate(start.getDate() + 2);
    start.setHours(20, 0, 0, 0);
    const { startTime, endTime } = makeSlot(start, durationMin);
    samples.push({
      movie: bookable[0]._id,
      room: rooms[0]._id,
      startTime,
      endTime,
      price: PRICES[0],
      status: "cancelled",
    });
  }

  await Showtime.insertMany(samples);

  // Thống kê theo cách Admin hiển thị
  let upcoming = 0;
  let showing = 0;
  let completed = 0;
  let cancelled = 0;
  const t = Date.now();
  for (const s of samples) {
    if (s.status === "cancelled") {
      cancelled += 1;
      continue;
    }
    if (s.status === "completed" || s.endTime.getTime() < t) {
      completed += 1;
      continue;
    }
    if (s.startTime.getTime() <= t && s.endTime.getTime() >= t) {
      showing += 1;
      continue;
    }
    upcoming += 1;
  }

  console.log(`Created ${samples.length} showtimes`);
  console.log(`  Sắp chiếu: ${upcoming}`);
  console.log(`  Đang chiếu: ${showing}`);
  console.log(`  Đã chiếu: ${completed}`);
  console.log(`  Đã hủy: ${cancelled}`);

  await mongoose.disconnect();
}

seedRoomsAndShowtimes().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
