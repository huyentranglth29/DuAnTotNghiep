const express = require('express');
const Movie = require('../models/Movie');

const router = express.Router();

const STATUS_FROM_CLIENT = {
  'coming-soon': ['coming_soon', 'coming-soon'],
  'now-showing': ['now_showing', 'now-showing'],
  featured: ['featured'],
  ended: ['ended'],
};

const STATUS_TO_CLIENT = {
  coming_soon: 'coming-soon',
  now_showing: 'now-showing',
  'coming-soon': 'coming-soon',
  'now-showing': 'now-showing',
  featured: 'featured',
  ended: 'ended',
};

function normalizeGenre(genre) {
  if (Array.isArray(genre)) {
    return genre.join(', ');
  }

  return genre || '';
}

function normalizeCast(cast) {
  if (!Array.isArray(cast)) {
    return [];
  }

  return cast.map((item, index) => {
    if (typeof item === 'string') {
      return {
        id: index + 1,
        name: item,
      };
    }

    return {
      id: item.id || item._id || index + 1,
      name: item.name || item.ten || '',
      avatarUrl: item.avatarUrl || item.avatar || item.anhAvatar,
    };
  });
}

function normalizeDuration(duration) {
  if (typeof duration === 'number') {
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  }

  return duration || '';
}

function normalizeReleaseDate(releaseDate) {
  if (!releaseDate) {
    return undefined;
  }

  if (releaseDate instanceof Date) {
    return releaseDate.toISOString().slice(0, 10);
  }

  return releaseDate;
}

function toClientMovie(movie) {
  return {
    id: movie._id.toString(),
    title: movie.title,
    posterUrl: movie.posterUrl || movie.poster,
    backdropUrl: movie.backdropUrl,
    rating: movie.rating || 0,
    genre: normalizeGenre(movie.genre),
    duration: normalizeDuration(movie.duration),
    synopsis: movie.synopsis || movie.description || '',
    cast: normalizeCast(movie.cast),
    status: STATUS_TO_CLIENT[movie.status] || movie.status,
    ageRating: movie.ageRating,
    isHot: movie.isHot,
    director: movie.director,
    releaseDate: normalizeReleaseDate(movie.releaseDate),
    price: movie.price,
  };
}

router.get('/', async (req, res, next) => {
  try {
    const {status, genre, _limit} = req.query;
    const filter = {};

    if (status && STATUS_FROM_CLIENT[status]) {
      filter.status = {$in: STATUS_FROM_CLIENT[status]};
    }

    if (genre) {
      filter.genre = {$regex: genre, $options: 'i'};
    }

    let query = Movie.find(filter).sort({createdAt: -1});

    if (_limit) {
      query = query.limit(Number(_limit));
    }

    const movies = await query;
    res.json(movies.map(toClientMovie));
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return res.status(404).json({message: 'Movie not found'});
    }

    res.json(toClientMovie(movie));
  } catch (error) {
    next(error);
  }
});

module.exports = router;
