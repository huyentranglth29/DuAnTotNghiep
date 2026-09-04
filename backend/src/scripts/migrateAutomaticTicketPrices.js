const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({path: path.resolve(__dirname, "../../.env")});

const Showtime = require("../models/Showtime");
const Movie = require("../models/Movie");
const {calculateShowtimePrice} = require("../services/ticketPricingService");

async function migrate() {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is missing");
  await mongoose.connect(process.env.MONGO_URI);

  const showtimes = await Showtime.find({}).select("startTime price");
  let updated = 0;
  for (const showtime of showtimes) {
    const price = calculateShowtimePrice(showtime.startTime);
    const result = await Showtime.updateOne({_id: showtime._id}, {$set: {price}});
    updated += result.modifiedCount;
  }

  const movies = await Movie.collection.updateMany({}, {$unset: {price: ""}});
  console.log(`Đã cập nhật ${updated}/${showtimes.length} suất chiếu theo khung giờ.`);
  console.log(`Đã xóa giá gốc khỏi ${movies.modifiedCount} phim.`);
  await mongoose.disconnect();
}

migrate().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exitCode = 1;
});
