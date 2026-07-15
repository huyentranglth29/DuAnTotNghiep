const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    rating: Number,

    comment: String,

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true, collection: "đánh giá" }
);

module.exports = mongoose.model("Review", reviewSchema);
