const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    immutable: true,
  },
  movieId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Movie",
    required: true,
    immutable: true,
  },
  showtimeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Showtime",
    required: true,
    immutable: true,
  },
  seats: {
    type: [
      {
        type: String,
        trim: true,
        match: [/^[A-Z][0-9]{1,2}$/, "Invalid seat format"],
      },
    ],
    validate: [(v) => v.length > 0, "At least one seat must be selected"],
  },
  totalPrice: {
    type: Number,
    required: [true, "Total price is required"],
    min: [0, "Total price cannot be negative"],
  },
  status: {
    type: String,
    enum: ["pending", "booked", "paid", "cancelled"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
});

module.exports = mongoose.model("Booking", BookingSchema);
