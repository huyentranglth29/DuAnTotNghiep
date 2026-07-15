const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    synopsis: {
      type: String,
      trim: true,
    },
    duration: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    genre: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },
    director: {
      type: String,
      trim: true,
    },
    cast: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },
    poster: {
      type: String,
      trim: true,
    },
    posterUrl: {
      type: String,
      trim: true,
    },
    backdropUrl: {
      type: String,
      trim: true,
    },
    trailer: {
      type: String,
      trim: true,
    },
    releaseDate: {
      type: mongoose.Schema.Types.Mixed,
    },
    status: {
      type: String,
      enum: [
        "coming_soon",
        "now_showing",
        "coming-soon",
        "now-showing",
        "featured",
        "ended",
      ],
      default: "coming_soon",
    },
    rating: {
      type: Number,
      default: 0,
    },
    ageRating: {
      type: String,
      trim: true,
    },
    isHot: {
      type: Boolean,
      default: false,
    },
    price: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: "phim",
  }
);

module.exports = mongoose.model("Movie", movieSchema);
