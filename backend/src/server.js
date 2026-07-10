const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const movieRoutes = require("./routes/movieRoutes");
const roomRoutes = require("./routes/roomRoutes");
const seatRoutes = require("./routes/seatRoutes");
const showtimeRoutes = require("./routes/showtimeRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const ticketRoutes = require("./routes/ticketRoutes");
const voucherRoutes = require("./routes/voucherRoutes");
const productRoutes = require("./routes/productRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

dotenv.config();

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// Home
app.get("/", (req, res) => {
  res.send("Backend Movie Booking Running");
});

// API Routes
app.use("/api/auth", authRoutes);
// /movies: tương thích app mobile + admin (trước dùng json-server)
app.use("/movies", movieRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/seats", seatRoutes);
app.use("/api/showtimes", showtimeRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/vouchers", voucherRoutes);
app.use("/api/products", productRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/notifications", notificationRoutes);

// Error Handler
app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

module.exports = app;
