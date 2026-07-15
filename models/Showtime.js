const mongoose = require("mongoose");

const ShowtimeSchema = new mongoose.Schema({
  movieId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Movie",
    required: true,
    immutable: true,
  },
  date: {
    type: Date,
    required: [true, "Date is required"],
  },
  time_start: {
    type: String,
    required: [true, "Start time is required"],
    trim: true,
    match: [
      /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      "Time start must be in HH:MM format",
    ],
  },
  time_end: {
    type: String,
    required: [true, "End time is required"],
    trim: true,
    match: [
      /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      "Time end must be in HH:MM format",
    ],
  },
  studio: {
    type: String,
    required: [true, "Studio is required"],
    trim: true,
    maxlength: [50, "Studio name cannot exceed 50 characters"],
  },
  price: {
    type: Number,
    required: [true, "Price is required"],
    min: [0, "Price cannot be negative"],
    max: [10000000, "Price exceeds maximum reasonable limit"],
  },
  bookedSeats: {
    type: [
      {
        type: String,
        trim: true,
        match: [/^[A-Z][0-9]{1,2}$/, "Invalid seat format"],
      },
    ],
    default: [],
  },
  status: {
    type: String,
    enum: {
      values: ["available", "full", "on boarding", "on play", "ended"],
      message: "{VALUE} is not a valid status",
    },
    default: "available",
  },
});

module.exports = mongoose.model("Showtime", ShowtimeSchema);
