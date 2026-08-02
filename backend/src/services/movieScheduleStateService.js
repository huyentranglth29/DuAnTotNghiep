const Movie = require("../models/Movie");
const Showtime = require("../models/Showtime");

async function syncMovieScheduleState(movieId) {
  if (!movieId) return null;
  const movie = await Movie.findById(movieId);
  if (!movie) return null;

  const now = new Date();
  const showtimes = await Showtime.find({
    movie: movieId,
    status: {$ne: "cancelled"},
  })
    .sort({startTime: 1})
    .select("startTime endTime status")
    .lean();

  const first = showtimes[0] || null;
  const activeOrFuture = showtimes.filter(
    (item) => item.status === "scheduled" && new Date(item.endTime) > now,
  );

  if (first) movie.releaseDate = first.startTime;
  else movie.releaseDate = undefined;

  const publicationReached = !movie.publishedAt || new Date(movie.publishedAt) <= now;
  const plannedDate = movie.expectedReleaseDate || first?.startTime || activeOrFuture[0]?.startTime;

  if (!publicationReached) {
    movie.status = "draft";
  } else if (activeOrFuture.length > 0) {
    if (!movie.expectedReleaseDate) movie.expectedReleaseDate = plannedDate;
    movie.status = new Date(plannedDate) <= now
      ? "now-showing"
      : "coming-soon";
  } else if (showtimes.length > 0) {
    movie.status = "ended";
  } else if (plannedDate && publicationReached) {
    movie.status = "coming-soon";
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

module.exports = {syncMovieScheduleState, syncAllMovieScheduleStates};
