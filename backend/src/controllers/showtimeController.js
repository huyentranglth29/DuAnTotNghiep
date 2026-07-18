const Showtime = require("../models/Showtime");
const Movie = require("../models/Movie");
const Seat = require("../models/Seat");
const BookedSeat = require("../models/BookedSeat");
const {
  buildEndTime,
  parseDurationMinutes,
  assertNoRoomConflict,
  getNextSlotSuggestion,
  resolveConflictDetails,
  formatConflictPayload,
} = require("../services/showtimeScheduleService");

const POPULATE = [
  { path: "movie", select: "title posterUrl duration ageRating genre status" },
  { path: "room", select: "name type totalSeats status" },
];

const sendConflict = (res, conflictError) =>
  res.status(409).json({
    success: false,
    message: conflictError.message,
    code: "SHOWTIME_CONFLICT",
    conflicts: formatConflictPayload(conflictError.conflicts || []),
    earliestAvailable: conflictError.earliestAvailable || null,
  });

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
      filter.status = "scheduled";
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
      "name type totalSeats status",
    );
    if (!showtime) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy suất chiếu" });
    }

    const [seats, soldLabels] = await Promise.all([
      Seat.find({ room: showtime.room._id, status: "active" })
        .sort({ row: 1, number: 1 })
        .lean(),
      BookedSeat.find({
        showtimeId: String(showtime._id),
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: { $gt: new Date() } },
        ],
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

const getShowtimeOccupancy = async (req, res, next) => {
  try {
    const rows = await BookedSeat.aggregate([
      {
        $match: {
          $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: { $gt: new Date() } },
          ],
        },
      },
      {
        $group: {
          _id: "$showtimeId",
          sold: { $sum: 1 },
        },
      },
    ]);

    const occupancy = {};
    rows.forEach((row) => {
      occupancy[String(row._id)] = row.sold;
    });

    return res.json({
      success: true,
      message: "Lấy tỉ lệ ghế thành công",
      data: occupancy,
    });
  } catch (error) {
    next(error);
  }
};

const getRoomSuggestion = async (req, res, next) => {
  try {
    const { room, date, excludeId, movie, duration, preferredStart } = req.query;
    if (!room) {
      return res.status(400).json({
        success: false,
        message: "Thiếu phòng chiếu",
      });
    }

    let durationMinutes = duration ? Number(duration) : 120;
    if (movie) {
      const movieDoc = await Movie.findById(movie).select("duration");
      if (movieDoc) {
        durationMinutes = parseDurationMinutes(movieDoc.duration);
      }
    }

    const suggestion = await getNextSlotSuggestion({
      room,
      date,
      excludeId: excludeId || null,
      durationMinutes,
      preferredStart: preferredStart || null,
    });

    return res.json({
      success: true,
      message: "Gợi ý giờ chiếu thành công",
      data: suggestion,
    });
  } catch (error) {
    next(error);
  }
};

const checkShowtimeConflicts = async (req, res, next) => {
  try {
    const { room, startTime, endTime, movie, excludeId } = req.body;
    if (!room || !startTime) {
      return res.status(400).json({
        success: false,
        message: "Thiếu phòng hoặc giờ bắt đầu",
      });
    }

    let end = endTime ? new Date(endTime) : null;
    if (!end && movie) {
      const movieDoc = await Movie.findById(movie);
      if (!movieDoc) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy phim",
        });
      }
      end = buildEndTime(startTime, movieDoc.duration);
    }

    if (!end) {
      return res.status(400).json({
        success: false,
        message: "Thiếu giờ kết thúc hoặc phim để tính thời lượng",
      });
    }

    const details = await resolveConflictDetails({
      room,
      startTime,
      endTime: end,
      excludeId: excludeId || null,
    });

    return res.json({
      success: true,
      data: {
        hasConflict: details.conflicts.length > 0,
        message: details.message,
        endTime: end,
        earliestAvailable: details.earliestAvailable,
        conflicts: formatConflictPayload(details.conflicts),
      },
    });
  } catch (error) {
    next(error);
  }
};

const createShowtime = async (req, res, next) => {
  try {
    const { movie, room, startTime, price, status } = req.body;

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
    // Luôn tự tính endTime từ thời lượng phim — không nhận endTime thủ công
    const end = buildEndTime(start, movieDoc.duration);

    if (status !== "cancelled") {
      try {
        await assertNoRoomConflict({
          room,
          startTime: start,
          endTime: end,
        });
      } catch (conflictError) {
        if (conflictError.code === "SHOWTIME_CONFLICT") {
          return sendConflict(res, conflictError);
        }
        throw conflictError;
      }
    }

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
      message: "Tạo mới thành công",
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

const updateShowtime = async (req, res, next) => {
  try {
    const existing = await Showtime.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy suất chiếu",
      });
    }

    const movieId = req.body.movie || existing.movie;
    const roomId = req.body.room || existing.room;
    const start = req.body.startTime
      ? new Date(req.body.startTime)
      : existing.startTime;
    const status =
      req.body.status !== undefined ? req.body.status : existing.status;
    const price =
      req.body.price !== undefined ? Number(req.body.price) : existing.price;

    const movieDoc = await Movie.findById(movieId);
    if (!movieDoc) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy phim",
      });
    }

    // Luôn tự tính lại endTime từ thời lượng phim
    const end = buildEndTime(start, movieDoc.duration);

    if (status !== "cancelled") {
      try {
        await assertNoRoomConflict({
          room: roomId,
          startTime: start,
          endTime: end,
          excludeId: existing._id,
        });
      } catch (conflictError) {
        if (conflictError.code === "SHOWTIME_CONFLICT") {
          return sendConflict(res, conflictError);
        }
        throw conflictError;
      }
    }

    existing.movie = movieId;
    existing.room = roomId;
    existing.startTime = start;
    existing.endTime = end;
    existing.price = price;
    existing.status = status;
    await existing.save();

    const populated = await Showtime.findById(existing._id).populate(POPULATE);

    res.status(200).json({
      success: true,
      message: "Cập nhật thành công",
      data: populated,
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
  getShowtimeOccupancy,
  getRoomSuggestion,
  checkShowtimeConflicts,
  createShowtime,
  updateShowtime,
  deleteShowtime,
};
