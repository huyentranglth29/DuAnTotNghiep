const mongoose = require("mongoose");
const {calculateShowtimePrice} = require("../services/ticketPricingService");

const showtimeSchema = new mongoose.Schema(
  {
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
      required: true,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["scheduled", "cancelled", "completed"],
      default: "scheduled",
    },
    screeningType: {
      type: String,
      enum: ["regular", "early"],
      default: "regular",
      index: true,
    },
    ticketSaleStartAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

showtimeSchema.pre("validate", function applyAutomaticTicketPrice() {
  if (this.startTime) {
    this.price = calculateShowtimePrice(this.startTime);
  }
});

showtimeSchema.post("init", function exposeAutomaticTicketPrice(doc) {
  if (doc.startTime) {
    doc.price = calculateShowtimePrice(doc.startTime);
  }
});

module.exports = mongoose.model("Showtime", showtimeSchema, "giờ chiếu");
