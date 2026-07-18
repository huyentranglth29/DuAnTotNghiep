/**
 * Gán lại movie cho suất chiếu bị mất ref (phim đã seed lại ID mới).
 * Ưu tiên khớp theo thời lượng gần với (endTime - startTime).
 *
 * Chạy: node src/scripts/remapShowtimeMovies.js
 */
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const Showtime = require("../models/Showtime");
const Movie = require("../models/Movie");
const { parseDurationMinutes } = require("../services/showtimeScheduleService");

async function remap() {
  await mongoose.connect(process.env.MONGO_URI);

  const movies = await Movie.find().select("title duration posterUrl").lean();
  if (!movies.length) {
    throw new Error("Không có phim trong collection phim. Hãy seed movies trước.");
  }

  const movieIds = new Set(movies.map((m) => String(m._id)));
  const showtimes = await Showtime.find().lean();
  let fixed = 0;
  let alreadyOk = 0;
  let index = 0;

  for (const show of showtimes) {
    const currentId = String(show.movie || "");
    if (movieIds.has(currentId)) {
      alreadyOk += 1;
      continue;
    }

    const slotMinutes = Math.max(
      1,
      Math.round(
        (new Date(show.endTime).getTime() - new Date(show.startTime).getTime()) /
          60000,
      ),
    );

    let best = movies[index % movies.length];
    let bestDiff = Number.POSITIVE_INFINITY;
    for (const movie of movies) {
      const duration = parseDurationMinutes(movie.duration);
      const diff = Math.abs(duration - slotMinutes);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = movie;
      }
    }

    await Showtime.updateOne(
      { _id: show._id },
      { $set: { movie: best._id } },
    );

    console.log(
      `Remap ${show._id} → ${best.title} (slot ${slotMinutes}p ≈ phim ${parseDurationMinutes(best.duration)}p)`,
    );
    fixed += 1;
    index += 1;
  }

  console.log(`Xong. Đã gán lại ${fixed} suất, ${alreadyOk} suất vẫn đúng.`);
  await mongoose.disconnect();
}

remap().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
