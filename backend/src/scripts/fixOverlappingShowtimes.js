/**
 * Sửa suất chiếu trùng phòng / thiếu 15 phút vệ sinh.
 * Giữ suất sớm hơn; dời suất sau = end trước + 15'.
 * Lặp đến khi không còn xung đột trong từng phòng.
 *
 * Chạy: node src/scripts/fixOverlappingShowtimes.js
 * Xem trước: node src/scripts/fixOverlappingShowtimes.js --dry-run
 */
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const Showtime = require("../models/Showtime");
const Movie = require("../models/Movie");
require("../models/Room");
const {
  CLEANUP_MINUTES,
  parseDurationMinutes,
  buildEndTime,
  withCleanup,
  rangesConflict,
} = require("../services/showtimeScheduleService");

const dryRun = process.argv.includes("--dry-run");

async function resolveDuration(showtime, movieCache) {
  const movieId = String(showtime.movie?._id || showtime.movie || "");
  if (showtime.movie?.duration != null) {
    return parseDurationMinutes(showtime.movie.duration);
  }
  if (movieId && movieCache.has(movieId)) {
    return movieCache.get(movieId);
  }
  if (movieId) {
    const movie = await Movie.findById(movieId).select("duration title").lean();
    const minutes = parseDurationMinutes(movie?.duration);
    movieCache.set(movieId, minutes);
    return minutes;
  }
  return 120;
}

async function fixRoom(roomShowtimes, movieCache) {
  let fixedInRoom = 0;
  let guard = 0;

  while (guard < 500) {
    guard += 1;
    roomShowtimes.sort(
      (a, b) => new Date(a.startTime) - new Date(b.startTime),
    );

    let conflictIndex = -1;
    for (let index = 1; index < roomShowtimes.length; index += 1) {
      const prev = roomShowtimes[index - 1];
      const current = roomShowtimes[index];
      if (
        rangesConflict(
          prev.startTime,
          prev.endTime,
          current.startTime,
          current.endTime,
        )
      ) {
        conflictIndex = index;
        break;
      }
    }

    if (conflictIndex < 0) {
      break;
    }

    const prev = roomShowtimes[conflictIndex - 1];
    const current = roomShowtimes[conflictIndex];
    const duration = await resolveDuration(current, movieCache);
    const newStart = withCleanup(prev.endTime);
    const newEnd = buildEndTime(newStart, duration);
    const roomName = prev.room?.name || current.room?.name || "Phòng";
    const title = current.movie?.title || "Phim";

    console.log(`[FIX] ${roomName} | ${title}`);
    console.log(
      `  Sau suất: ${prev.movie?.title || "Phim"} ${formatLocal(prev.startTime)}-${formatLocal(prev.endTime)}`,
    );
    console.log(
      `  ${formatLocal(current.startTime)}-${formatLocal(current.endTime)} → ${formatLocal(newStart)}-${formatLocal(newEnd)}`,
    );

    if (!dryRun) {
      current.startTime = newStart;
      current.endTime = newEnd;
      await Showtime.updateOne(
        { _id: current._id },
        { $set: { startTime: newStart, endTime: newEnd } },
      );
    } else {
      current.startTime = newStart;
      current.endTime = newEnd;
    }

    roomShowtimes[conflictIndex] = current;
    fixedInRoom += 1;
  }

  return fixedInRoom;
}

function formatLocal(value) {
  return new Date(value).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  });
}

async function fixOverlaps() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing");
  }

  await mongoose.connect(process.env.MONGO_URI);

  const showtimes = await Showtime.find({ status: { $ne: "cancelled" } })
    .populate("movie", "title duration")
    .populate("room", "name")
    .lean();

  const byRoom = new Map();
  for (const item of showtimes) {
    const roomId = String(item.room?._id || item.room);
    if (!byRoom.has(roomId)) {
      byRoom.set(roomId, []);
    }
    byRoom.get(roomId).push(item);
  }

  const movieCache = new Map();
  let fixed = 0;

  for (const [, roomShowtimes] of byRoom) {
    fixed += await fixRoom(roomShowtimes, movieCache);
  }

  console.log(
    dryRun
      ? `Dry-run xong. Cần sửa ${fixed} lần dời suất.`
      : `Đã sửa xong. Tổng ${fixed} lần dời suất (+${CLEANUP_MINUTES}p vệ sinh).`,
  );

  await mongoose.disconnect();
}

fixOverlaps().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
