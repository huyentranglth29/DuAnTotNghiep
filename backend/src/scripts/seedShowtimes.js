const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const Room = require("../models/Room");
const Movie = require("../models/Movie");
const Showtime = require("../models/Showtime");

const DEFAULT_ROOMS = [
  { name: "Cinema 01", type: "IMAX", totalSeats: 150, status: "active" },
  { name: "Cinema 02", type: "3D", totalSeats: 120, status: "active" },
  { name: "Cinema 03", type: "2D", totalSeats: 100, status: "active" },
  { name: "Cinema 04", type: "VIP", totalSeats: 60, status: "active" },
];

const HOURS = [9, 11, 14, 16, 19, 21];
const PRICES = [110000, 120000, 130000, 140000, 150000, 160000, 170000];
const DAYS = 7;
const force = process.argv.includes("--force");

function atHour(dayOffset, hour, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, minute, 0, 0);
  return date;
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

  const movies = await Movie.find();
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
        `Showtimes already exist: ${existing}. Use --force to recreate more samples.`,
      );
      await mongoose.disconnect();
      return;
    }
  }

  const samples = [];
  let index = 0;

  for (let day = 0; day < DAYS; day += 1) {
    for (let hourIndex = 0; hourIndex < HOURS.length; hourIndex += 1) {
      const movie = movies[index % movies.length];
      const room = rooms[index % rooms.length];
      const startTime = atHour(day, HOURS[hourIndex]);
      const endTime = new Date(startTime);
      endTime.setHours(endTime.getHours() + 2);
      endTime.setMinutes(endTime.getMinutes() + 15);

      samples.push({
        movie: movie._id,
        room: room._id,
        startTime,
        endTime,
        price: PRICES[index % PRICES.length],
        status: day === 0 && hourIndex === 0 ? "completed" : "scheduled",
      });

      index += 1;
    }
  }

  await Showtime.insertMany(samples);
  console.log(
    `Created ${samples.length} showtimes (${DAYS} days x ${HOURS.length} slots)`,
  );
  await mongoose.disconnect();
}

seedRoomsAndShowtimes().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
