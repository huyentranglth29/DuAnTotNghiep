/**
 * Sửa suất chiếu trỏ phim đã mất + ghi movieTitle vào vé cũ.
 * Usage: node src/scripts/fixBookingMovieTitles.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Showtime = require("../models/Showtime");
const Movie = require("../models/Movie");

const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  "mongodb://127.0.0.1:27017/filmgo";

const run = async () => {
  await mongoose.connect(MONGO_URI);

  const movies = await Movie.find().select("title").lean();
  if (!movies.length) {
    console.log("Không có phim trong DB. Chạy npm run seed:movies trước.");
    await mongoose.disconnect();
    process.exit(1);
  }

  const showtimes = await Showtime.find().lean();
  let fixedSt = 0;
  for (let i = 0; i < showtimes.length; i += 1) {
    const st = showtimes[i];
    const exists = await Movie.exists({ _id: st.movie });
    if (!exists) {
      const m = movies[i % movies.length];
      await Showtime.updateOne({ _id: st._id }, { $set: { movie: m._id } });
      fixedSt += 1;
    }
  }
  console.log(`Đã nối lại ${fixedSt} suất chiếu với phim hiện có.`);

  const bookings = await Booking.find().lean();
  let fixedBk = 0;
  for (const b of bookings) {
    const st = await Showtime.findById(b.showtime)
      .populate("movie", "title")
      .lean();
    const title = st?.movie?.title || "";
    if (title && b.movieTitle !== title) {
      await Booking.updateOne(
        { _id: b._id },
        { $set: { movieTitle: title } }
      );
      fixedBk += 1;
      console.log(`${String(b._id).slice(-6)} -> ${title}`);
    }
  }
  console.log(`Đã cập nhật tên phim cho ${fixedBk} vé.`);

  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.disconnect();
  } catch (_) {
    /* ignore */
  }
  process.exit(1);
});
