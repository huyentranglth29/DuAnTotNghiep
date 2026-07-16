const Showtime = require("../models/Showtime");
const Movie = require("../models/Movie");
const Seat = require("../models/Seat");
const BookedSeat = require("../models/BookedSeat");

const POPULATE = [
  { path: "movie", select: "title posterUrl duration ageRating genre status" },
  { path: "room", select: "name type totalSeats status" },
];

function parseDurationMinutes(duration) {
  if (typeof duration === "number" && Number.isFinite(duration)) {
    return duration;
  }

  if (typeof duration !== "string") {
    return 120;
  }

  const hourMatch = duration.match(/(\d+)\s*h/i);
  const minuteMatch = duration.match(/(\d+)\s*m/i);
  const hours = hourMatch ? Number(hourMatch[1]) : 0;
  const minutes = minuteMatch ? Number(minuteMatch[1]) : 0;

  if (!hours && !minutes) {
    const asNumber = Number(duration);
    return Number.isFinite(asNumber) && asNumber > 0 ? asNumber : 120;
  }

  return hours * 60 + minutes;
}

function buildEndTime(startTime, duration) {
  const end = new Date(startTime);
  end.setMinutes(end.getMinutes() + parseDurationMinutes(duration) + 15);
  return end;
}

const getShowtimes = async (req, res, next) => {
  try {
    const { movie, room, date, status, bookable } = req.query;
    const filter = {};

    if (movie) {
      filter.movie = movie;
    }

    if (room) {
      filter.room = room;
    }

    if (status) {
      filter.status = status;
    }

    // Ngày theo VN (UTC+7) để khớp App / Admin, tránh lệch timezone server
    if (date) {
      const dayStart = new Date(`${date}T00:00:00+07:00`);
      const dayEnd = new Date(`${date}T23:59:59.999+07:00`);
      filter.startTime = { $gte: dayStart, $lte: dayEnd };
    }

    // App User: chỉ suất còn đặt (scheduled + chưa kết thúc)
    if (bookable === "1" || bookable === "true") {
      filter.status = filter.status || "scheduled";
      filter.endTime = { $gt: new Date() };
    }

    const showtimes = await Showtime.find(filter)
      .populate(POPULATE)
      .sort({ startTime: 1 });

    res.status(200).json({
      success: true,
      data: showtimes,
    });
  } catch (error) {
    next(error);
  }
};

const getShowtimeById = async (req, res, next) => {
  try {
    const showtime = await Showtime.findById(req.params.id).populate(POPULATE);

    if (!showtime) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy suất chiếu",
      });
    }

    res.status(200).json({
      success: true,
      data: showtime,
    });
  } catch (error) {
    next(error);
  }
};

const getShowtimeSeats = async (req, res, next) => {
  try {
    const showtime = await Showtime.findById(req.params.id).populate(
      "room",
      "name type totalSeats status"
    );
    if (!showtime) {
      return res.status(404).json({ success: false, message: "Không tìm thấy suất chiếu" });
    }

    const [seats, soldLabels] = await Promise.all([
      Seat.find({ room: showtime.room._id, status: "active" })
        .sort({ row: 1, number: 1 })
        .lean(),
      BookedSeat.find({
        showtimeId: String(showtime._id),
        $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: new Date() } }],
      }).distinct("seatLabel"),
    ]);
    const sold = new Set(soldLabels);

    return res.json({
      success: true,
      data: {
        showtimeId: String(showtime._id),
        room: showtime.room,
        seats: seats.map((seat) => ({
          id: String(seat._id),
          label: `${seat.row}${seat.number}`,
          row: seat.row,
          number: seat.number,
          type: seat.type,
          isBooked: sold.has(`${seat.row}${seat.number}`),
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

const createShowtime = async (req, res, next) => {
  try {
    const { movie, room, startTime, endTime, price, status } = req.body;

    if (!movie || !room || !startTime || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "Thiếu phim, phòng, giờ chiếu hoặc giá vé",
      });
    }

    const movieDoc = await Movie.findById(movie);
    if (!movieDoc) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy phim",
      });
    }

    const start = new Date(startTime);
    const end = endTime
      ? new Date(endTime)
      : buildEndTime(start, movieDoc.duration);

    const showtime = await Showtime.create({
      movie,
      room,
      startTime: start,
      endTime: end,
      price: Number(price),
      status: status || "scheduled",
    });

    const populated = await Showtime.findById(showtime._id).populate(POPULATE);

    res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

const updateShowtime = async (req, res, next) => {
  try {
    const payload = { ...req.body };

    if (payload.price !== undefined) {
      payload.price = Number(payload.price);
    }

    if (payload.startTime) {
      payload.startTime = new Date(payload.startTime);

      if (!payload.endTime && payload.movie) {
        const movieDoc = await Movie.findById(payload.movie);
        if (movieDoc) {
          payload.endTime = buildEndTime(payload.startTime, movieDoc.duration);
        }
      }
    }

    if (payload.endTime) {
      payload.endTime = new Date(payload.endTime);
    }

    const showtime = await Showtime.findByIdAndUpdate(req.params.id, payload, {
      returnDocument: "after",
      runValidators: true,
    }).populate(POPULATE);

    if (!showtime) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy suất chiếu",
      });
    }

    res.status(200).json({
      success: true,
      data: showtime,
    });
  } catch (error) {
    next(error);
  }
};

const deleteShowtime = async (req, res, next) => {
  try {
    const showtime = await Showtime.findByIdAndDelete(req.params.id);

    if (!showtime) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy suất chiếu",
      });
    }

    res.status(200).json({
      success: true,
      message: "Đã xóa suất chiếu",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getShowtimes,
  getShowtimeById,
  getShowtimeSeats,
  createShowtime,
  updateShowtime,
  deleteShowtime,
};
