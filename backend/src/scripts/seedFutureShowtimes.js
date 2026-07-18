const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const Movie = require("../models/Movie");
const Room = require("../models/Room");
const Seat = require("../models/Seat");
const Showtime = require("../models/Showtime");

const BOOKABLE_MOVIE_STATUSES = [
  "now-showing",
  "now_showing",
  "coming-soon",
  "coming_soon",
  "featured",
];
const HOURS = [9, 12, 15, 18, 21];
const DAYS = 7;
const TARGET_PER_MOVIE = 3;

function durationMinutes(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const text = String(value || "");
  const hours = Number(text.match(/(\d+)\s*h/i)?.[1] || 0);
  const minutes = Number(text.match(/(\d+)\s*m/i)?.[1] || 0);
  const numeric = Number(text);
  if (hours || minutes) return hours * 60 + minutes;
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 120;
}

async function availableRoom(rooms, startTime, endTime, offset) {
  for (let index = 0; index < rooms.length; index += 1) {
    const room = rooms[(index + offset) % rooms.length];
    const overlap = await Showtime.exists({
      room: room._id,
      status: "scheduled",
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
    });
    if (!overlap) return room;
  }
  return null;
}

async function seedFutureShowtimes() {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is missing");
  await mongoose.connect(process.env.MONGO_URI);

  const [movies, allRooms] = await Promise.all([
    Movie.find({ status: { $in: BOOKABLE_MOVIE_STATUSES } })
      .sort({ isHot: -1, createdAt: -1 }),
    Room.find({ status: "active" }).sort({ name: 1 }),
  ]);

  const rooms = [];
  for (const room of allRooms) {
    if (await Seat.exists({ room: room._id, status: "active" })) rooms.push(room);
  }

  if (!movies.length) throw new Error("Không có phim đang/sắp chiếu");
  if (!rooms.length) throw new Error("Không có phòng active đã được tạo ghế");

  const now = new Date();
  let created = 0;
  let skipped = 0;

  for (let index = 0; index < movies.length; index += 1) {
    const movie = movies[index];
    const existing = await Showtime.countDocuments({
      movie: movie._id,
      status: "scheduled",
      endTime: { $gt: now },
    });
    let needed = Math.max(0, TARGET_PER_MOVIE - existing);

    for (let day = 0; day < DAYS && needed > 0; day += 1) {
      for (let hourIndex = 0; hourIndex < HOURS.length && needed > 0; hourIndex += 1) {
        const startTime = new Date(now);
        startTime.setDate(startTime.getDate() + day);
        startTime.setHours(HOURS[(hourIndex + index) % HOURS.length], 0, 0, 0);
        if (startTime <= new Date(now.getTime() + 20 * 60 * 1000)) {
          skipped += 1;
          continue;
        }

      const endTime = new Date(
        startTime.getTime() + durationMinutes(movie.duration) * 60 * 1000,
      );
        const duplicate = await Showtime.exists({
          movie: movie._id,
          startTime,
        });
        if (duplicate) {
          skipped += 1;
          continue;
        }

        const room = await availableRoom(
          rooms,
          startTime,
          endTime,
          index + day + hourIndex,
        );
        if (!room) {
          skipped += 1;
          continue;
        }

        await Showtime.create({
          movie: movie._id,
          room: room._id,
          startTime,
          endTime,
          price: Number(movie.price || 100000),
          status: "scheduled",
        });
        created += 1;
        needed -= 1;
      }
    }
  }

  console.log(`Created future showtimes: ${created}`);
  console.log(`Skipped unavailable/duplicate slots: ${skipped}`);
  console.log(
    `Bookable showtimes now: ${await Showtime.countDocuments({
      status: "scheduled",
      endTime: { $gt: new Date() },
    })}`,
  );
  await mongoose.disconnect();
}

seedFutureShowtimes().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
