const Movie = require("../models/Movie");
const Showtime = require("../models/Showtime");

// ==========================
// Chuyển dữ liệu cho App
// ==========================

const STATUS_FROM_CLIENT = {
  "coming-soon": ["coming_soon", "coming-soon"],
  "now-showing": ["now_showing", "now-showing", "featured"],
  featured: ["featured"],
  ended: ["ended"],
  stopped: ["stopped"],
};

const STATUS_TO_CLIENT = {
  coming_soon: "coming-soon",
  now_showing: "now-showing",
  "coming-soon": "coming-soon",
  "now-showing": "now-showing",
  featured: "featured",
  ended: "ended",
  stopped: "stopped",
};

function normalizeGenre(genre) {
  if (Array.isArray(genre)) {
    return genre.join(", ");
  }
  return genre || "";
}

function normalizeCast(cast) {
  if (!Array.isArray(cast)) return [];

  return cast.map((item, index) => ({
    id: item.id || item._id || index + 1,
    name: item.name || item,
    avatarUrl: item.avatarUrl || "",
  }));
}

function normalizeDuration(duration) {
  if (typeof duration === "number") {
    const hour = Math.floor(duration / 60);
    const minute = duration % 60;

    return hour > 0 ? `${hour}h ${minute}m` : `${minute}m`;
  }

  return duration || "";
}

function toClientMovie(movie) {
  return {
    id: movie._id,
    title: movie.title,
    posterUrl: movie.posterUrl,
    backdropUrl: movie.backdropUrl,
    genre: normalizeGenre(movie.genre),
    duration: normalizeDuration(movie.duration),
    synopsis: movie.synopsis,
    director: movie.director,
    cast: normalizeCast(movie.cast),
    rating: movie.rating,
    status: STATUS_TO_CLIENT[movie.status] || movie.status,
    ageRating: movie.ageRating,
    releaseDate: movie.releaseDate,
    price: movie.price,
    isHot: movie.isHot,
  };
}

// ==========================
// Lấy tất cả phim
// ==========================

const getMovies = async (req, res, next) => {
  try {
    const { status, genre, _limit, hasShowtimes } = req.query;

    const filter = {};

    if (status && STATUS_FROM_CLIENT[status]) {
      filter.status = {
        $in: STATUS_FROM_CLIENT[status],
      };
    }

    if (genre) {
      filter.genre = {
        $regex: genre,
        $options: "i",
      };
    }

    // Khớp Admin suất chiếu: chỉ phim đang có suất đặt được
    if (hasShowtimes === "1" || hasShowtimes === "true" || hasShowtimes === "bookable") {
      const now = new Date();
      const upcoming = await Showtime.find({
        status: "scheduled",
        endTime: { $gt: now },
      })
        .select("movie startTime")
        .sort({ startTime: 1 })
        .lean();

      const nextByMovie = new Map();
      for (const row of upcoming) {
        const key = String(row.movie);
        if (!nextByMovie.has(key)) {
          nextByMovie.set(key, row.startTime);
        }
      }

      const movieIds = Array.from(nextByMovie.keys());
      filter._id = { $in: movieIds };

      let movies = await Movie.find(filter).lean();

      // Sắp xếp theo suất sớm nhất — cùng “nhịp” với danh sách Admin
      movies.sort((a, b) => {
        const ta = nextByMovie.get(String(a._id))?.getTime?.() || 0;
        const tb = nextByMovie.get(String(b._id))?.getTime?.() || 0;
        return ta - tb;
      });

      if (_limit) {
        movies = movies.slice(0, Number(_limit));
      }

      return res.status(200).json({
        success: true,
        data: movies.map(toClientMovie),
      });
    }

    let query = Movie.find(filter).sort({
      createdAt: -1,
    });

    if (_limit) {
      query = query.limit(Number(_limit));
    }

    const movies = await query;

    res.status(200).json({
      success: true,
      data: movies.map(toClientMovie),
    });
  } catch (error) {
    next(error);
  }
};

// ==========================
// Chi tiết phim
// ==========================

const getMovieById = async (req, res, next) => {
  try {

    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy phim",
      });
    }

    res.status(200).json({
      success: true,
      data: toClientMovie(movie),
    });

  } catch (error) {
    next(error);
  }
};

// ==========================
// Thêm phim
// ==========================

const createMovie = async (req, res, next) => {
  try {

    const {
      title,
      genre,
      duration,
      synopsis,
      posterUrl,
      backdropUrl,
      director,
      cast,
      rating,
      status,
      ageRating,
      releaseDate,
      isHot,
      price,
    } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Tên phim không được để trống",
      });
    }

    const movie = await Movie.create({
      title,
      genre,
      duration,
      synopsis,
      posterUrl,
      backdropUrl,
      director,
      cast,
      rating,
      status,
      ageRating,
      releaseDate,
      isHot,
      price,
    });

    res.status(201).json({
      success: true,
      message: "Thêm phim thành công",
      data: movie,
    });

  } catch (error) {
    next(error);
  }
};

// ==========================
// Cập nhật phim
// ==========================

const updateMovie = async (req, res, next) => {
  try {

    const movie = await Movie.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        returnDocument: "after",
        runValidators: true,
      }
    );

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy phim",
      });
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật phim thành công",
      data: movie,
    });

  } catch (error) {
    next(error);
  }
};

// ==========================
// Xóa phim
// ==========================

const deleteMovie = async (req, res, next) => {
  try {

    const movie = await Movie.findByIdAndDelete(req.params.id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy phim",
      });
    }

    res.status(200).json({
      success: true,
      message: "Xóa phim thành công",
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
};
