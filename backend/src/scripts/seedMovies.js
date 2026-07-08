const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');
const Movie = require('../models/Movie');
const db = require('../../../db.json');

dotenv.config({path: path.resolve(__dirname, '../../.env')});

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
    throw new Error('MONGO_URI is missing in backend/.env');
  }

  await mongoose.connect(process.env.MONGO_URI);

  await Movie.deleteMany({});
  await Movie.insertMany(db.movies.map(toMongoMovie));

  console.log(`Seeded ${db.movies.length} movies`);
  await mongoose.disconnect();
}

seedMovies().catch(async error => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
