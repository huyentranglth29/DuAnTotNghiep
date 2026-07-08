const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const movieRoutes = require('./routes/movieRoutes');

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// In-memory reviews store (simple demo). In production replace with DB.
const reviews = [];

app.get("/", (req, res) => {
  res.send("Backend Movie Booking Running");
});

app.use('/movies', movieRoutes);

// GET /reviews?movieId=123
app.get('/reviews', (req, res) => {
  const { movieId } = req.query;
  if (movieId) {
    const filtered = reviews.filter(r => String(r.movieId) === String(movieId));
    return res.json(filtered);
  }
  res.json(reviews);
});

// POST /reviews
app.post('/reviews', (req, res) => {
  const { movieId, rating, text, tags } = req.body;
  if (!movieId) return res.status(400).json({ message: 'movieId is required' });
  if (!rating && rating !== 0) return res.status(400).json({ message: 'rating is required' });
  if (!text) return res.status(400).json({ message: 'text is required' });

  const newReview = {
    id: String(Date.now()),
    movieId,
    rating,
    text,
    tags: tags || [],
    date: new Date().toISOString(),
    likes: 0,
    replies: 0,
  };

  reviews.unshift(newReview);

  res.status(201).json(newReview);
});

const PORT = process.env.PORT || 3000;

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
