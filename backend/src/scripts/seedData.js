const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const Movie = require("../models/Movie");
const Booking = require("../models/Booking");
const Notification = require("../models/Notification");
const Product = require("../models/Product");
const Review = require("../models/Review");
const Room = require("../models/Room");
const Seat = require("../models/Seat");
const Showtime = require("../models/Showtime");
const Ticket = require("../models/Ticket");
const User = require("../models/User");
const Voucher = require("../models/Voucher");
const connectDB = require("../config/db");

const movies = [
  {
    title: "Lật Mặt 8",
    description: "Phim hành động gia đình Việt Nam.",
    synopsis: "Một câu chuyện về lựa chọn, gia đình và lòng tin.",
    duration: 120,
    genre: ["Action", "Drama"],
    director: "Ly Hai",
    cast: ["Quoc Cuong", "Thanh Thuc"],
    posterUrl: "https://example.com/posters/lat-mat-8.jpg",
    backdropUrl: "https://example.com/backdrops/lat-mat-8.jpg",
    releaseDate: new Date("2026-07-01"),
    status: "now_showing",
    rating: 8.2,
    ageRating: "T13",
    isHot: true,
    price: 110000,
  },
  {
    title: "Mua He Ruc Ro",
    description: "Tuổi trẻ, tình bạn và những chuyến đi.",
    synopsis: "Nhóm bạn gặp lại nhau trong mùa hè cuối cùng.",
    duration: 105,
    genre: ["Romance", "Comedy"],
    director: "FilmGo Studio",
    cast: ["Minh Anh", "Bao Nam"],
    posterUrl: "https://example.com/posters/mua-he-ruc-ro.jpg",
    backdropUrl: "https://example.com/backdrops/mua-he-ruc-ro.jpg",
    releaseDate: new Date("2026-07-10"),
    status: "now_showing",
    rating: 7.8,
    ageRating: "P",
    isHot: false,
    price: 100000,
  },
  {
    title: "Thanh Pho Khong Ngu",
    description: "Trinh thám đô thị.",
    synopsis: "Một điều tra viên lần theo chuỗi vụ án bí ẩn.",
    duration: 130,
    genre: ["Thriller", "Crime"],
    director: "Nguyen Tran",
    cast: ["Hoang Phuc", "Lan Vy"],
    posterUrl: "https://example.com/posters/thanh-pho-khong-ngu.jpg",
    backdropUrl: "https://example.com/backdrops/thanh-pho-khong-ngu.jpg",
    releaseDate: new Date("2026-08-01"),
    status: "coming_soon",
    rating: 0,
    ageRating: "T16",
    isHot: true,
    price: 120000,
  },
  {
    title: "Robot Cuoi Cung",
    description: "Khoa học viễn tưởng dành cho gia đình.",
    synopsis: "Một robot nhỏ tìm cách cứu thành phố tương lai.",
    duration: 98,
    genre: ["Sci-Fi", "Family"],
    director: "Tran An",
    cast: ["Voice Cast A", "Voice Cast B"],
    posterUrl: "https://example.com/posters/robot-cuoi-cung.jpg",
    backdropUrl: "https://example.com/backdrops/robot-cuoi-cung.jpg",
    releaseDate: new Date("2026-07-20"),
    status: "now_showing",
    rating: 8,
    ageRating: "P",
    isHot: false,
    price: 95000,
  },
  {
    title: "Dem Hoa Dang",
    description: "Tâm lý, lịch sử.",
    synopsis: "Một gia đình gìn giữ lời hứa qua nhiều thế hệ.",
    duration: 115,
    genre: ["Drama", "History"],
    director: "Le Mai",
    cast: ["Thu Ha", "Quang Minh"],
    posterUrl: "https://example.com/posters/dem-hoa-dang.jpg",
    backdropUrl: "https://example.com/backdrops/dem-hoa-dang.jpg",
    releaseDate: new Date("2026-06-15"),
    status: "featured",
    rating: 8.5,
    ageRating: "T13",
    isHot: true,
    price: 115000,
  },
];

const rooms = [
  { name: "Phòng 1", type: "2D", totalSeats: 20, status: "active" },
  { name: "Phòng 2", type: "IMAX", totalSeats: 20, status: "active" },
];

const vouchers = [
  {
    code: "FILMGO10",
    description: "Giảm 10% cho đơn từ 100000",
    discountType: "percent",
    discountValue: 10,
    minOrderValue: 100000,
    maxDiscount: 30000,
    quantity: 100,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    status: "active",
  },
  {
    code: "COMBO20K",
    description: "Giảm 20000 cho combo bắp nước",
    discountType: "amount",
    discountValue: 20000,
    minOrderValue: 80000,
    quantity: 50,
    startDate: new Date(),
    endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    status: "active",
  },
];

const products = [
  {
    name: "Bắp rang bơ",
    image: "https://example.com/products/popcorn.jpg",
    price: 55000,
    stock: 100,
    description: "Bắp rang bơ size vừa.",
    isActive: true,
  },
  {
    name: "Nước ngọt",
    image: "https://example.com/products/soda.jpg",
    price: 30000,
    stock: 120,
    description: "Nước ngọt ly lớn.",
    isActive: true,
  },
  {
    name: "Combo FilmGo",
    image: "https://example.com/products/combo.jpg",
    price: 85000,
    stock: 80,
    description: "Một bắp và hai nước.",
    isActive: true,
  },
];

const notifications = [
  {
    title: "Khuyến mãi cuối tuần",
    content: "Giảm giá vé cho các suất chiếu cuối tuần tại FilmGo.",
    target: "all",
    sentAt: new Date(),
  },
  {
    title: "Phim mới ra rạp",
    content: "Danh sách phim mới đã được cập nhật trong tuần này.",
    target: "all",
    sentAt: new Date(),
  },
  {
    title: "Ưu đãi thành viên VIP",
    content: "Thành viên VIP nhận thêm ưu đãi khi đặt combo.",
    target: "vip",
    sentAt: new Date(),
  },
];

const upsertBy = async (Model, key, records) => {
  const docs = [];
  for (const record of records) {
    const doc = await Model.findOneAndUpdate(
      { [key]: record[key] },
      { $setOnInsert: record },
      { returnDocument: "after", upsert: true, runValidators: true },
    );
    docs.push(doc);
  }
  return docs;
};

const createSeatsForRoom = async (room) => {
  const seats = [];
  const rows = ["A", "B"];

  for (const row of rows) {
    for (let number = 1; number <= 10; number += 1) {
      seats.push({
        room: room._id,
        row,
        number,
        type: row === "B" ? "vip" : "normal",
        status: "active",
      });
    }
  }

  for (const seat of seats) {
    await Seat.findOneAndUpdate(
      { room: seat.room, row: seat.row, number: seat.number },
      { $setOnInsert: seat },
      { returnDocument: "after", upsert: true, runValidators: true },
    );
  }
};

const seedShowtimes = async (movieDocs, roomDocs) => {
  const existing = await Showtime.countDocuments();
  if (existing > 0) {
    return [];
  }

  const now = new Date();
  const samples = movieDocs.slice(0, 5).map((movie, index) => {
    const startTime = new Date(now);
    startTime.setDate(startTime.getDate() + index + 1);
    startTime.setHours(10 + index * 2, 0, 0, 0);

    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + Number(movie.duration || 120) + 15);

    return {
      movie: movie._id,
      room: roomDocs[index % roomDocs.length]._id,
      startTime,
      endTime,
      price: movie.price || 100000,
      status: "scheduled",
    };
  });

  return Showtime.insertMany(samples);
};

const seedReviews = async (movieDocs, user) => {
  if (!user) return [];

  const records = movieDocs.slice(0, 3).map((movie, index) => ({
    movie: movie._id,
    user: user._id,
    rating: 5 - index,
    comment: `Đánh giá mẫu cho ${movie.title}`,
    status: index === 2 ? "pending" : "approved",
  }));

  const docs = [];
  for (const record of records) {
    const doc = await Review.findOneAndUpdate(
      { movie: record.movie, user: record.user },
      { $setOnInsert: record },
      { returnDocument: "after", upsert: true, runValidators: true },
    );
    docs.push(doc);
  }
  return docs;
};

const seedBookingsAndTickets = async (user) => {
  if (!user) return { bookings: [], tickets: [] };

  const showtimes = await Showtime.find().sort({ startTime: 1 }).limit(3);
  const bookings = [];
  const tickets = [];

  for (let index = 0; index < showtimes.length; index += 1) {
    const showtime = showtimes[index];
    const seats = await Seat.find({ room: showtime.room }).sort({ row: 1, number: 1 }).skip(index * 2).limit(2);
    if (seats.length === 0) continue;

    const booking = await Booking.findOneAndUpdate(
      { user: user._id, showtime: showtime._id, seats: seats.map((seat) => seat._id) },
      {
        $setOnInsert: {
          user: user._id,
          showtime: showtime._id,
          seats: seats.map((seat) => seat._id),
          totalPrice: showtime.price * seats.length,
          status: index === 2 ? "pending" : "paid",
          paymentMethod: index === 1 ? "momo" : "card",
          paymentStatus: index === 2 ? "unpaid" : "paid",
        },
      },
      { returnDocument: "after", upsert: true, runValidators: true },
    );
    bookings.push(booking);

    for (let seatIndex = 0; seatIndex < seats.length; seatIndex += 1) {
      const seat = seats[seatIndex];
      const code = `FG-${String(index + 1).padStart(2, "0")}${seat.row}${seat.number}`;
      const ticket = await Ticket.findOneAndUpdate(
        { code },
        {
          $setOnInsert: {
            booking: booking._id,
            showtime: showtime._id,
            seat: seat._id,
            code,
            price: showtime.price,
            status: index === 0 && seatIndex === 0 ? "used" : "valid",
          },
        },
        { returnDocument: "after", upsert: true, runValidators: true },
      );
      tickets.push(ticket);
    }
  }

  return { bookings, tickets };
};

async function seedData() {
  await connectDB();

  const movieDocs = await upsertBy(Movie, "title", movies);
  const roomDocs = await upsertBy(Room, "name", rooms);
  await upsertBy(Voucher, "code", vouchers);
  await upsertBy(Product, "name", products);
  await upsertBy(Notification, "title", notifications);

  for (const room of roomDocs) {
    await createSeatsForRoom(room);
  }

  const showtimeDocs = await seedShowtimes(movieDocs, roomDocs);
  const user = await User.findOne({ role: "admin" }) || await User.findOne();
  const reviewDocs = await seedReviews(movieDocs, user);
  const { bookings, tickets } = await seedBookingsAndTickets(user);

  console.log(`Seeded movies: ${movieDocs.length}`);
  console.log(`Seeded rooms: ${roomDocs.length}`);
  console.log("Seeded seats for each room");
  console.log(`Seeded showtimes: ${showtimeDocs.length || "already exists"}`);
  console.log(`Seeded vouchers: ${vouchers.length}`);
  console.log(`Seeded products: ${products.length}`);
  console.log(`Seeded notifications: ${notifications.length}`);
  console.log(`Seeded reviews: ${reviewDocs.length}`);
  console.log(`Seeded bookings: ${bookings.length}`);
  console.log(`Seeded tickets: ${tickets.length}`);

  await mongoose.disconnect();
}

seedData().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
