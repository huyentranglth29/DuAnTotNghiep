const dotenv = require("dotenv");
const path = require("path");
const mongoose = require("mongoose");
const Movie = require("../models/Movie");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

/**
 * ~16 phim demo — đủ 3 trạng thái, khớp App + Admin.
 * Đang chiếu 8 | Sắp chiếu 5 | Đã chiếu 3
 */
const MOVIES = [
  // —— Đang chiếu (8) ——
  {
    title: "Lật Mặt 8: Vòng Tay Định Mệnh",
    synopsis: "Gia đình phải đối mặt với bí mật cũ khi một người thân trở về.",
    duration: "2h 05m",
    genre: ["Hài", "Gia đình"],
    director: "Lý Hải",
    status: "featured",
    ageRating: "T13",
    isHot: true,
    rating: 8.1,
    releaseDate: "2026-06-01",
    price: 95000,
    posterUrl: "https://picsum.photos/seed/latmat8/400/600",
    backdropUrl: "https://picsum.photos/seed/latmat8-bg/800/450",
  },
  {
    title: "Mai",
    synopsis: "Câu chuyện tình cảm đầy cảm xúc của một cô gái bán tóc.",
    duration: "2h 11m",
    genre: ["Tình cảm", "Chính kịch"],
    director: "Trấn Thành",
    status: "now-showing",
    ageRating: "T16",
    isHot: true,
    rating: 8.4,
    releaseDate: "2026-05-20",
    price: 100000,
    posterUrl: "https://picsum.photos/seed/mai-vn/400/600",
    backdropUrl: "https://picsum.photos/seed/mai-vn-bg/800/450",
  },
  {
    title: "Đất Rừng Phương Nam",
    synopsis: "Hành trình của An tìm cha qua vùng sông nước miền Tây.",
    duration: "2h 20m",
    genre: ["Phiêu lưu", "Gia đình"],
    director: "Nguyễn Quang Dũng",
    status: "now-showing",
    ageRating: "P",
    isHot: false,
    rating: 7.9,
    releaseDate: "2026-06-10",
    price: 90000,
    posterUrl: "https://picsum.photos/seed/datrung/400/600",
    backdropUrl: "https://picsum.photos/seed/datrung-bg/800/450",
  },
  {
    title: "Quỷ Nhập Tràng",
    synopsis: "Ngôi làng bị ám ảnh bởi nghi thức mai táng cổ xưa.",
    duration: "1h 55m",
    genre: ["Kinh dị"],
    director: "Trần Hữu Tấn",
    status: "now-showing",
    ageRating: "T18",
    isHot: true,
    rating: 7.6,
    releaseDate: "2026-07-01",
    price: 110000,
    posterUrl: "https://picsum.photos/seed/quynhap/400/600",
    backdropUrl: "https://picsum.photos/seed/quynhap-bg/800/450",
  },
  {
    title: "Bộ Tứ Báo Thủ",
    synopsis: "Bốn người bạn thân lập kế hoạch 'báo thù' đầy bất ngờ.",
    duration: "1h 58m",
    genre: ["Hài"],
    director: "Trấn Thành",
    status: "now-showing",
    ageRating: "T13",
    isHot: false,
    rating: 7.8,
    releaseDate: "2026-06-25",
    price: 95000,
    posterUrl: "https://picsum.photos/seed/botu/400/600",
    backdropUrl: "https://picsum.photos/seed/botu-bg/800/450",
  },
  {
    title: "NEON RECKONING",
    synopsis:
      "Cựu điều tra viên đối mặt quá khứ trong thành phố neon vĩnh cửu.",
    duration: "2h 10m",
    genre: ["Hành động", "Khoa học viễn tưởng"],
    director: "Jordan Hale",
    status: "now-showing",
    ageRating: "T16",
    isHot: true,
    rating: 8.8,
    releaseDate: "2026-06-15",
    price: 150000,
    posterUrl: "https://picsum.photos/seed/neon-reckoning/400/600",
    backdropUrl: "https://picsum.photos/seed/neon-reckoning-bg/800/450",
  },
  {
    title: "Star Horizon",
    synopsis: "Phi hành đoàn tìm kiếm hành tinh sống sót cuối cùng.",
    duration: "2h 18m",
    genre: ["Khoa học viễn tưởng"],
    director: "Ava Quinn",
    status: "now-showing",
    ageRating: "T13",
    isHot: false,
    rating: 8.0,
    releaseDate: "2026-06-20",
    price: 140000,
    posterUrl: "https://picsum.photos/seed/star-horizon/400/600",
    backdropUrl: "https://picsum.photos/seed/star-horizon-bg/800/450",
  },
  {
    title: "Shadow District",
    synopsis: "Thám tử lang thang trong khu phố tội phạm bị lãng quên.",
    duration: "1h 58m",
    genre: ["Hình sự", "Giật gân"],
    director: "Leo Park",
    status: "now-showing",
    ageRating: "T18",
    isHot: false,
    rating: 7.7,
    releaseDate: "2026-07-02",
    price: 130000,
    posterUrl: "https://picsum.photos/seed/shadow-district/400/600",
    backdropUrl: "https://picsum.photos/seed/shadow-district-bg/800/450",
  },
  // —— Sắp chiếu (5) ——
  {
    title: "Mưa Đỏ",
    synopsis: "Câu chuyện chiến tranh và tình người giữa biển lửa.",
    duration: "2h 15m",
    genre: ["Chiến tranh", "Chính kịch"],
    director: "Đặng Thái Huyền",
    status: "coming-soon",
    ageRating: "T16",
    isHot: true,
    rating: 0,
    releaseDate: "2026-08-15",
    price: 100000,
    posterUrl: "https://picsum.photos/seed/muado/400/600",
    backdropUrl: "https://picsum.photos/seed/muado-bg/800/450",
  },
  {
    title: "Yêu Nhầm Bạn Thân",
    synopsis: "Tình bạn chuyển hóa thành tình yêu một cách vụng về.",
    duration: "1h 52m",
    genre: ["Hài", "Tình cảm"],
    director: "Nguyễn Ngọc Tân",
    status: "coming-soon",
    ageRating: "T13",
    isHot: false,
    rating: 0,
    releaseDate: "2026-08-22",
    price: 90000,
    posterUrl: "https://picsum.photos/seed/yeunham/400/600",
    backdropUrl: "https://picsum.photos/seed/yeunham-bg/800/450",
  },
  {
    title: "Thám Tử Kiến Và Kho Báu",
    synopsis: "Cuộc phiêu lưu của chú kiến thám tử cùng đồng đội.",
    duration: "1h 40m",
    genre: ["Hoạt hình", "Gia đình"],
    director: "Studio FilmGo",
    status: "coming-soon",
    ageRating: "P",
    isHot: true,
    rating: 0,
    releaseDate: "2026-09-01",
    price: 85000,
    posterUrl: "https://picsum.photos/seed/thamtu-kien/400/600",
    backdropUrl: "https://picsum.photos/seed/thamtu-kien-bg/800/450",
  },
  {
    title: "Iron Comet",
    synopsis: "Phi công trẻ ngăn thiên thạch lao vào Trái Đất.",
    duration: "2h 05m",
    genre: ["Hành động"],
    director: "Kim Sato",
    status: "coming-soon",
    ageRating: "T13",
    isHot: true,
    rating: 0,
    releaseDate: "2026-08-30",
    price: 145000,
    posterUrl: "https://picsum.photos/seed/iron-comet/400/600",
    backdropUrl: "https://picsum.photos/seed/iron-comet-bg/800/450",
  },
  {
    title: "Tết Ở Làng Địa Ngục 2",
    synopsis: "Làng quê ngày Tết lại bị cuốn vào lời nguyền mới.",
    duration: "1h 50m",
    genre: ["Kinh dị", "Hài"],
    director: "Trần Hữu Tấn",
    status: "coming-soon",
    ageRating: "T16",
    isHot: true,
    rating: 0,
    releaseDate: "2027-01-20",
    price: 105000,
    posterUrl: "https://picsum.photos/seed/tetlang2/400/600",
    backdropUrl: "https://picsum.photos/seed/tetlang2-bg/800/450",
  },
  // —— Đã chiếu (3) ——
  {
    title: "Bố Già",
    synopsis: "Ông Ba Sang và những chuyện đời thường đầy nước mắt.",
    duration: "2h 08m",
    genre: ["Gia đình", "Chính kịch"],
    director: "Trấn Thành",
    status: "ended",
    ageRating: "T13",
    isHot: false,
    rating: 8.5,
    releaseDate: "2021-03-12",
    price: 75000,
    posterUrl: "https://picsum.photos/seed/bogia/400/600",
    backdropUrl: "https://picsum.photos/seed/bogia-bg/800/450",
  },
  {
    title: "Hai Phượng",
    synopsis: "Người mẹ đơn thân lao vào thế giới tội phạm để cứu con.",
    duration: "1h 38m",
    genre: ["Hành động"],
    director: "Lê Văn Kiệt",
    status: "ended",
    ageRating: "T18",
    isHot: false,
    rating: 8.0,
    releaseDate: "2019-02-22",
    price: 80000,
    posterUrl: "https://picsum.photos/seed/haiphuong/400/600",
    backdropUrl: "https://picsum.photos/seed/haiphuong-bg/800/450",
  },
  {
    title: "Nhà Bà Nữ",
    synopsis: "Ba thế hệ phụ nữ trong một căn nhà nhỏ Sài Gòn.",
    duration: "2h 04m",
    genre: ["Gia đình", "Hài"],
    director: "Trấn Thành",
    status: "ended",
    ageRating: "T13",
    isHot: false,
    rating: 8.0,
    releaseDate: "2023-01-22",
    price: 80000,
    posterUrl: "https://picsum.photos/seed/nhabanu/400/600",
    backdropUrl: "https://picsum.photos/seed/nhabanu-bg/800/450",
  },
];

function toMongoMovie(movie) {
  return {
    title: movie.title,
    description: movie.synopsis,
    synopsis: movie.synopsis,
    duration: movie.duration,
    genre: movie.genre,
    director: movie.director,
    cast: movie.cast || [],
    poster: movie.posterUrl,
    posterUrl: movie.posterUrl,
    backdropUrl: movie.backdropUrl,
    releaseDate: movie.releaseDate,
    status: movie.status,
    rating: movie.rating,
    ageRating: movie.ageRating,
    isHot: movie.isHot,
    price: movie.price,
  };
}

async function seedMovies() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing in backend/.env");
  }

  await mongoose.connect(process.env.MONGO_URI);

  const all = MOVIES.map(toMongoMovie);
  await Movie.deleteMany({});
  await Movie.insertMany(all);

  const summary = await Movie.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  console.log(`Seeded ${all.length} movies`);
  summary.forEach((row) => console.log(`  ${row._id}: ${row.count}`));

  await mongoose.disconnect();
}

seedMovies().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
