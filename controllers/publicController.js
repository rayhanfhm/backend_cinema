const Movie = require("../models/Movie");
const Showtime = require("../models/Showtime");

/**
 * Controller publik untuk menampilkan film dan jadwal tayang ke user umum
 */

const getAllMovies = async (req, res) => {
  try {
    const { search, genre } = req.query;
    const query = {};

    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    if (genre) {
      query.genre = genre;
    }

    const movies = await Movie.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      results: movies.length,
      data: movies,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error retrieving movies",
      error: error.message,
    });
  }
};

/**
 * Mengambil detail satu film berdasarkan ID
 */
const getMovieById = async (req, res) => {
  try {
    const { id } = req.params;
    const movie = await Movie.findById(id);

    if (!movie) {
      return res.status(404).json({ status: "error", message: "Movie not found" });
    }

    res.status(200).json({ status: "success", data: movie });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error retrieving movie detail",
      error: error.message,
    });
  }
};

/**
 * Mengambil semua showtime untuk film tertentu
 */
const getMovieShowtimes = async (req, res) => {
  try {
    const { movieId } = req.params;
    const showtimes = await Showtime.find({ movieId }).populate("movieId", "title").sort({ date: 1, time_start: 1 });

    res.status(200).json({
      status: "success",
      results: showtimes.length,
      data: showtimes,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error retrieving showtimes",
      error: error.message,
    });
  }
};

module.exports = {
  getAllMovies,
  getMovieById,
  getMovieShowtimes,
};