const Review = require("../models/Review");
const Movie = require("../models/Movie");
const Showtime = require("../models/Showtime");
const Booking = require("../models/Booking");
const QuickBooking = require("../models/QuickBooking");
const mongoose = require("mongoose");

const isValidId = value => mongoose.Types.ObjectId.isValid(value);

const getEligibility = async (movieId, userId) => {
  const endedShowtimes = await Showtime.find({
    movie: movieId,
    endTime: {$lte: new Date()},
    status: {$ne: "cancelled"},
  }).select("_id").lean();
  const showtimeIds = endedShowtimes.map(item => item._id);

  if (!showtimeIds.length) {
    return {canReview: false, verifiedViewer: false};
  }
  if (!userId) {
    return {canReview: true, verifiedViewer: false};
  }

  const stringIds = showtimeIds.map(String);
  const [booking, quickBooking] = await Promise.all([
    Booking.exists({
      user: userId,
      showtime: {$in: showtimeIds},
      $or: [{status: "paid"}, {paymentStatus: "paid"}],
    }),
    QuickBooking.exists({
      user: userId,
      showtimeId: {$in: stringIds},
      status: "paid",
    }),
  ]);

  return {canReview: true, verifiedViewer: Boolean(booking || quickBooking)};
};

const serializeReview = review => {
  const data = review?.toObject ? review.toObject() : review;
  if (!data) return data;
  return {
    ...data,
    user: data.user ? {
      _id: data.user._id,
      fullName: data.user.fullName,
      avatar: data.user.avatar,
    } : null,
  };
};

const getApproved = async (req, res, next) => {
  try {
    const movieId = req.query.movie || req.query.movieId;
    if (!movieId || !isValidId(movieId)) {
      return res.status(400).json({message: "ID phim không hợp lệ"});
    }

    const reviews = await Review.find({movie: movieId, status: "approved"})
      .populate("user", "fullName avatar")
      .sort({createdAt: -1})
      .lean();

    return res.json(reviews.map(serializeReview));
  } catch (error) {
    return next(error);
  }
};

const getMine = async (req, res, next) => {
  try {
    const movieId = req.query.movie || req.query.movieId;
    if (!movieId || !isValidId(movieId)) {
      return res.status(400).json({message: "ID phim không hợp lệ"});
    }

    const review = await Review.findOne({movie: movieId, user: req.user._id})
      .populate("user", "fullName avatar")
      .lean();
    return res.json(review ? serializeReview(review) : null);
  } catch (error) {
    return next(error);
  }
};

const checkEligibility = async (req, res, next) => {
  try {
    const movieId = req.query.movie || req.query.movieId;
    if (!movieId || !isValidId(movieId)) {
      return res.status(400).json({message: "ID phim không hợp lệ"});
    }
    if (!await Movie.exists({_id: movieId})) {
      return res.status(404).json({message: "Phim không tồn tại"});
    }

    return res.json(await getEligibility(movieId, req.user?._id));
  } catch (error) {
    return next(error);
  }
};

const saveMine = async (req, res, next) => {
  try {
    const movieId = req.body.movie || req.body.movieId;
    const rating = Number(req.body.rating);
    const comment = String(req.body.comment || req.body.text || "").trim();

    if (!movieId || !isValidId(movieId)) {
      return res.status(400).json({message: "ID phim không hợp lệ"});
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({message: "Vui lòng chọn từ 1 đến 5 sao"});
    }
    if (comment.length < 3 || comment.length > 1000) {
      return res.status(400).json({message: "Nội dung đánh giá phải từ 3 đến 1000 ký tự"});
    }
    const movie = await Movie.findById(movieId).select("title").lean();
    if (!movie) {
      return res.status(404).json({message: "Phim không tồn tại"});
    }

    const eligibility = await getEligibility(movieId, req.user._id);
    if (!eligibility.canReview) {
      return res.status(403).json({
        message: "Bạn có thể đánh giá sau khi suất chiếu đầu tiên của phim kết thúc",
      });
    }

    const review = await Review.findOneAndUpdate(
      {movie: movieId, user: req.user._id},
      {
        $set: {
          rating,
          comment,
          status: "pending",
          movieTitle: movie.title || "",
          userName: req.user.fullName || req.user.name || "",
          userEmail: req.user.email || "",
          verifiedViewer: eligibility.verifiedViewer,
          verifiedAt: eligibility.verifiedViewer ? new Date() : null,
        },
        $setOnInsert: {movie: movieId, user: req.user._id},
      },
      {
        returnDocument: "after",
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    ).populate("user", "fullName avatar");

    return res.status(201).json({
      message: "Đánh giá đã được gửi và đang chờ duyệt",
      data: serializeReview(review),
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({message: "Bạn đã đánh giá phim này"});
    }
    return next(error);
  }
};

module.exports = {getApproved, getMine, checkEligibility, saveMine};
