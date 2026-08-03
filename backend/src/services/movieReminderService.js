const MovieReminder = require("../models/MovieReminder");
const Showtime = require("../models/Showtime");
const {createNotification} = require("./notificationService");

async function sendDueMovieReminders() {
  const now = new Date();
  const rows = await MovieReminder.find({saleNotifiedAt: null})
    .populate({path: "movie", match: {ticketSaleStartAt: {$lte: now}}, select: "title posterUrl"});

  for (const row of rows.filter((item) => item.movie)) {
    const hasBookableShowtime = await Showtime.exists({
      movie: row.movie._id,
      status: "scheduled",
      startTime: {$gt: now},
    });
    if (!hasBookableShowtime) continue;
    await createNotification({
      title: `${row.movie.title} đã mở bán vé`,
      content: "Lịch chiếu đã sẵn sàng. Đặt vé ngay trên FilmGo!",
      type: "phim",
      user: row.user,
      entityId: row.movie._id,
      action: "mo_chi_tiet_phim",
      image: row.movie.posterUrl,
    });
    row.saleNotifiedAt = now;
    await row.save();
  }
}

module.exports = {sendDueMovieReminders};
