const mongoose = require("mongoose");

const MovieSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Title is required"],
    trim: true,
    maxlength: [200, "Title cannot exceed 200 characters"],
  },
  genre: {
    type: [
      {
        type: String,
        trim: true,
        maxlength: [50, "Genre name too long"],
      },
    ],
    validate: [(v) => v.length > 0, "At least one genre is required"],
  },
  duration: {
    type: Number,
    required: [true, "Duration is required"],
    min: [1, "Duration must be at least 1 minute"],
    max: [500, "Duration exceeds maximum limit"],
  },
  rating: {
    type: String,
    required: [true, "Rating is required"],
    trim: true,
    maxlength: [10, "Rating cannot exceed 10 characters"],
  },
  poster: {
    type: String,
    required: [true, "Poster is required"],
    trim: true,
  },
  description: {
    type: String,
    required: [true, "Description is required"],
    trim: true,
    maxlength: [2000, "Description cannot exceed 2000 characters"],
  },
});

module.exports = mongoose.model("Movie", MovieSchema);
