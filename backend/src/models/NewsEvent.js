const mongoose = require("mongoose");

const newsEventSchema = new mongoose.Schema(
  {
    title: {type: String, required: true, trim: true},
    summary: {type: String, trim: true, default: ""},
    content: {type: String, required: true, trim: true},
    image: {type: String, trim: true, default: ""},
    category: {
      type: String,
      enum: ["tin_tuc", "su_kien", "khuyen_mai"],
      default: "tin_tuc",
    },
    status: {
      type: String,
      enum: ["nhap", "da_dang"],
      default: "nhap",
    },
    isFeatured: {type: Boolean, default: false},
    publishDate: {type: Date, default: Date.now},
    createdBy: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
  },
  {timestamps: true},
);

newsEventSchema.index({status: 1, publishDate: -1});

module.exports = mongoose.model("NewsEvent", newsEventSchema, "tin tức sự kiện");
