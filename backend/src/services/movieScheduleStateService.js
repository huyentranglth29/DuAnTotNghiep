const Movie = require("../models/Movie");
const Showtime = require("../models/Showtime");

const VIETNAM_TIME_ZONE = "Asia/Ho_Chi_Minh";

function startOfVietnamDay(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: VIETNAM_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = type => parts.find(part => part.type === type)?.value;
  return new Date(`${get("year")}-${get("month")}-${get("day")}T00:00:00+07:00`);
}

async function syncMovieScheduleState(movieId) {
  if (!movieId) return null;
  const movie = await Movie.findById(movieId);
  if (!movie) return null;
  if (movie.status === "stopped") return movie;

  const now = new Date();
  const showtimes = await Showtime.find({
    movie: movieId,
    status: {$ne: "cancelled"},
  })
    .sort({startTime: 1})
    .select("startTime endTime status screeningType")
    .lean();

  // Suất chiếu sớm là ngoại lệ trước ngày phát hành, không được dùng để
  // tự chuyển cả phim sang tab Đang chiếu.
  const regularShowtimes = showtimes.filter(
    (item) => item.screeningType !== "early",
  );
  const firstRegular = regularShowtimes[0] || null;
  const activeOrFutureRegular = regularShowtimes.filter(
    (item) => item.status === "scheduled" && new Date(item.endTime) > now,
  );

  if (firstRegular) movie.releaseDate = firstRegular.startTime;
  else movie.releaseDate = undefined;

  const publicationReached = !movie.publishedAt || new Date(movie.publishedAt) <= now;
  const expectedTime = movie.expectedReleaseDate
    ? new Date(movie.expectedReleaseDate).getTime()
    : Number.POSITIVE_INFINITY;
  const firstRegularTime = firstRegular
    ? new Date(firstRegular.startTime).getTime()
    : Number.POSITIVE_INFINITY;
  const earliestReleaseTime = Math.min(expectedTime, firstRegularTime);
  const plannedDate = Number.isFinite(earliestReleaseTime)
    ? new Date(earliestReleaseTime)
    : null;
  const plannedDay = startOfVietnamDay(plannedDate);
  const releaseDayReached = Boolean(plannedDay && plannedDay <= now);

  if (!publicationReached) {
    movie.status = "draft";
  } else if (activeOrFutureRegular.length > 0) {
    if (!movie.expectedReleaseDate) movie.expectedReleaseDate = plannedDate;
    movie.status = releaseDayReached
      ? "now-showing"
      : "coming-soon";
  } else if (regularShowtimes.length > 0) {
    movie.status = "ended";
  } else if (plannedDay) {
    movie.status = releaseDayReached ? "awaiting-showtime" : "coming-soon";
  } else {
    movie.status = "draft";
  }

  await movie.save();
  return movie;
}

async function syncAllMovieScheduleStates() {
  const movieIds = await Movie.find().distinct("_id");
  await Promise.all(movieIds.map((movieId) => syncMovieScheduleState(movieId)));
}

module.exports = {
  startOfVietnamDay,
  syncMovieScheduleState,
  syncAllMovieScheduleStates,
};
