const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const Movie = require("../models/Movie");
const Room = require("../models/Room");
const Showtime = require("../models/Showtime");
const { syncMovieScheduleState } = require("../services/movieScheduleStateService");

const DEMO_MARKER = "[FilmGo Demo]";

const ROOM_SEEDS = [
  { name: "Phòng Demo 1", type: "2D", totalSeats: 113, status: "active" },
  { name: "Phòng Demo 2", type: "IMAX", totalSeats: 113, status: "active" },
  { name: "Phòng Demo 3", type: "VIP", totalSeats: 113, status: "active" },
];

const MOVIE_SETS = {
  nowShowing: [
    {
      title: "Đường Đua Ánh Sáng",
      synopsis: "Một tay đua trẻ trở lại đường đua để cứu đội xe gia đình.",
      duration: 118,
      genre: ["Hành động", "Thể thao"],
      director: "Nguyễn Minh Khang",
      ageRating: "T13",
      price: 130000,
      rating: 8.2,
      isHot: true,
      posterSeed: "duong-dua-anh-sang",
    },
    {
      title: "Bí Mật Sau Rạp Cũ",
      synopsis: "Nhóm bạn phát hiện một cuộn phim bị nguyền trong rạp bỏ hoang.",
      duration: 106,
      genre: ["Kinh dị", "Giật gân"],
      director: "Lê Hoàng Nam",
      ageRating: "T16",
      price: 120000,
      rating: 7.8,
      isHot: true,
      posterSeed: "bi-mat-sau-rap-cu",
    },
    {
      title: "Ngày Nắng Cuối Hạ",
      synopsis: "Câu chuyện trưởng thành nhẹ nhàng của những người bạn cuối cấp.",
      duration: 112,
      genre: ["Tình cảm", "Học đường"],
      director: "Trần Mai Anh",
      ageRating: "P",
      price: 100000,
      rating: 8.0,
      isHot: false,
      posterSeed: "ngay-nang-cuoi-ha",
    },
  ],
  early: [
    {
      title: "Thành Phố Không Ngủ",
      synopsis: "Một phi vụ xuyên đêm mở ra bí mật của thành phố tương lai.",
      duration: 124,
      genre: ["Hành động", "Khoa học viễn tưởng"],
      director: "Phạm Quốc Huy",
      ageRating: "T16",
      price: 150000,
      rating: 0,
      isHot: true,
      posterSeed: "thanh-pho-khong-ngu",
    },
    {
      title: "Mùa Hoa Trên Biển",
      synopsis: "Một chuyến tàu đưa hai người xa lạ đến hành trình chữa lành.",
      duration: 109,
      genre: ["Tình cảm", "Chính kịch"],
      director: "Vũ An Nhiên",
      ageRating: "T13",
      price: 110000,
      rating: 0,
      isHot: false,
      posterSeed: "mua-hoa-tren-bien",
    },
    {
      title: "Robot Nhỏ Và Vũ Trụ Lớn",
      synopsis: "Chú robot giao hàng vô tình trở thành hy vọng cuối cùng của Trái Đất.",
      duration: 98,
      genre: ["Hoạt hình", "Gia đình"],
      director: "FilmGo Animation",
      ageRating: "P",
      price: 95000,
      rating: 0,
      isHot: true,
      posterSeed: "robot-nho-vu-tru-lon",
    },
  ],
  comingSoon: [
    {
      title: "Hồ Sơ Mật 08",
      synopsis: "Một điều tra viên lần theo vụ án mất tích kéo dài tám năm.",
      duration: 116,
      genre: ["Hình sự", "Bí ẩn"],
      director: "Đỗ Khánh Linh",
      ageRating: "T16",
      price: 120000,
      rating: 0,
      isHot: true,
      posterSeed: "ho-so-mat-08",
    },
    {
      title: "Bếp Nhà Mình",
      synopsis: "Gia đình ba thế hệ tìm lại nhau qua những bữa cơm cuối tuần.",
      duration: 102,
      genre: ["Gia đình", "Hài"],
      director: "Ngô Thanh Tâm",
      ageRating: "P",
      price: 90000,
      rating: 0,
      isHot: false,
      posterSeed: "bep-nha-minh",
    },
    {
      title: "Cơn Mưa Sao Băng",
      synopsis: "Một nhóm sinh viên săn mưa sao băng và gặp biến cố thay đổi đời mình.",
      duration: 114,
      genre: ["Phiêu lưu", "Tình cảm"],
      director: "Hoàng Gia Bảo",
      ageRating: "T13",
      price: 105000,
      rating: 0,
      isHot: true,
      posterSeed: "con-mua-sao-bang",
    },
  ],
};

function addDays(base, days, hour, minute = 0) {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  next.setHours(hour, minute, 0, 0);
  return next;
}

function endTime(startTime, duration) {
  return new Date(startTime.getTime() + Number(duration) * 60 * 1000);
}

function moviePayload(movie, group, now) {
  const isNowShowing = group === "nowShowing";
  const isComingSoon = group === "comingSoon";
  const expectedReleaseDate = isNowShowing
    ? addDays(now, -1, 9)
    : isComingSoon
      ? addDays(now, 14, 9)
      : addDays(now, 7, 9);

  return {
    title: movie.title,
    description: `${DEMO_MARKER} ${movie.synopsis}`,
    synopsis: movie.synopsis,
    duration: movie.duration,
    genre: movie.genre,
    director: movie.director,
    cast: [],
    language: "Tiếng Việt",
    poster: `https://picsum.photos/seed/${movie.posterSeed}/400/600`,
    posterUrl: `https://picsum.photos/seed/${movie.posterSeed}/400/600`,
    backdropUrl: `https://picsum.photos/seed/${movie.posterSeed}-bg/900/500`,
    releaseDate: isNowShowing ? addDays(now, -1, 9) : undefined,
    expectedReleaseDate,
    publishedAt: addDays(now, -10, 8),
    ticketSaleStartAt: addDays(now, -3, 8),
    status: isNowShowing ? "now-showing" : "coming-soon",
    rating: movie.rating,
    ageRating: movie.ageRating,
    isHot: movie.isHot,
    price: movie.price,
  };
}

async function upsertRooms() {
  const rooms = [];
  for (const room of ROOM_SEEDS) {
    const doc = await Room.findOneAndUpdate(
      { name: room.name },
      { $set: room },
      { returnDocument: "after", upsert: true },
    );
    rooms.push(doc);
  }
  return rooms;
}

async function upsertMovies(now) {
  const records = [];
  for (const [group, movies] of Object.entries(MOVIE_SETS)) {
    for (const movie of movies) {
      const doc = await Movie.findOneAndUpdate(
        { title: movie.title },
        { $set: moviePayload(movie, group, now) },
        { returnDocument: "after", upsert: true },
      );
      records.push({ group, movie: doc, seed: movie });
    }
  }
  return records;
}

function buildShowtimes(records, rooms, now) {
  const showtimes = [];
  const byGroup = records.reduce((map, record) => {
    map[record.group] = map[record.group] || [];
    map[record.group].push(record);
    return map;
  }, {});

  byGroup.nowShowing.forEach((record, index) => {
    const start = new Date(now.getTime() - (35 + index * 8) * 60 * 1000);
    showtimes.push({
      movie: record.movie._id,
      room: rooms[index % rooms.length]._id,
      startTime: start,
      endTime: endTime(start, record.seed.duration),
      price: record.seed.price,
      status: "scheduled",
      screeningType: "regular",
    });

    const tonight = addDays(now, 0, 19 + index, index ? 30 : 0);
    if (tonight > now) {
      showtimes.push({
        movie: record.movie._id,
        room: rooms[(index + 1) % rooms.length]._id,
        startTime: tonight,
        endTime: endTime(tonight, record.seed.duration),
        price: record.seed.price,
        status: "scheduled",
        screeningType: "regular",
      });
    }
  });

  byGroup.early.forEach((record, index) => {
    const start = addDays(now, 2 + index, 18 + index, 15);
    showtimes.push({
      movie: record.movie._id,
      room: rooms[index % rooms.length]._id,
      startTime: start,
      endTime: endTime(start, record.seed.duration),
      price: record.seed.price,
      status: "scheduled",
      screeningType: "early",
    });
  });

  byGroup.comingSoon.forEach((record, index) => {
    const start = addDays(now, 14 + index, 17 + index, 0);
    showtimes.push({
      movie: record.movie._id,
      room: rooms[index % rooms.length]._id,
      startTime: start,
      endTime: endTime(start, record.seed.duration),
      price: record.seed.price,
      status: "scheduled",
      screeningType: "regular",
    });
  });

  return showtimes;
}

async function seedDemoFilmSets() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing in backend/.env");
  }

  await mongoose.connect(process.env.MONGO_URI);

  const now = new Date();
  const rooms = await upsertRooms();
  const records = await upsertMovies(now);
  const movieIds = records.map((record) => record.movie._id);

  const deleted = await Showtime.deleteMany({ movie: { $in: movieIds } });
  const showtimes = buildShowtimes(records, rooms, now);
  await Showtime.insertMany(showtimes);
  await Promise.all(movieIds.map((movieId) => syncMovieScheduleState(movieId)));

  const counts = records.reduce((result, record) => {
    result[record.group] = (result[record.group] || 0) + 1;
    return result;
  }, {});

  console.log(`Seeded ${records.length} demo movies`);
  console.log(`  Đang chiếu: ${counts.nowShowing || 0}`);
  console.log(`  Chiếu sớm: ${counts.early || 0}`);
  console.log(`  Sắp chiếu: ${counts.comingSoon || 0}`);
  console.log(`Replaced ${deleted.deletedCount} old demo showtimes`);
  console.log(`Created ${showtimes.length} demo showtimes`);

  await mongoose.disconnect();
}

seedDemoFilmSets().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
