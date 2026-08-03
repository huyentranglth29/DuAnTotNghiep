const Movie = require("../models/Movie");
const MovieReminder = require("../models/MovieReminder");

const list = async (req, res, next) => {
  try {
    const rows = await MovieReminder.find({user: req.user._id}).select("movie -_id").lean();
    return res.json({success: true, data: rows.map((row) => String(row.movie))});
  } catch (error) {
    next(error);
  }
};

const subscribe = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.movieId).select("title ticketSaleStartAt");
    if (!movie) return res.status(404).json({success: false, message: "Phim không tồn tại"});
    if (!movie.ticketSaleStartAt || new Date(movie.ticketSaleStartAt) <= new Date()) {
      return res.status(400).json({success: false, message: "Phim đã mở bán vé"});
    }
    await MovieReminder.findOneAndUpdate(
      {user: req.user._id, movie: movie._id},
      {$setOnInsert: {user: req.user._id, movie: movie._id}},
      {upsert: true, new: true},
    );
    return res.json({success: true, message: "Đã đăng ký nhắc khi mở bán vé"});
  } catch (error) {
    next(error);
  }
};

const unsubscribe = async (req, res, next) => {
  try {
    await MovieReminder.deleteOne({user: req.user._id, movie: req.params.movieId});
    return res.json({success: true, message: "Đã hủy lời nhắc"});
  } catch (error) {
    next(error);
  }
};

module.exports = {list, subscribe, unsubscribe};
