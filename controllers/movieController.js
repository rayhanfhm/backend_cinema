const Movie = require("../models/Movie");
const fs = require("fs");
const path = require("path");

// GET ALL MOVIES
exports.getAllMovies = async (req, res) => {
  try {
    const { search, genre } = req.query;

    // Pagination
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 25);
    const skip = (page - 1) * limit;

    // Filter
    const query = {};

    if (search) {
      query.title = {
        $regex: search,
        $options: "i",
      };
    }

    if (genre) {
      query.genre = genre;
    }

    const movies = await Movie.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalItems = await Movie.countDocuments(query);

    res.status(200).json({
      status: "success",
      message: "Data film berhasil diambil.",
      data: movies.map((movie) => ({
        id: movie._id,
        title: movie.title,
        poster: movie.poster,
        genre: movie.genre,
        rating: movie.rating,
      })),
      meta: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server.",
    });
  }
};

// GET ALL MOVIES (ADMIN) - Tanpa pagination & filtering
exports.getAllMoviesAdmin = async (req, res) => {
  try {
    const movies = await Movie.find().sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      message: "Seluruh data film berhasil diambil untuk Admin.",
      totalItems: movies.length,
      data: movies,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server saat mengambil data film.",
      error: error.message,
    });
  }
};

// GET MOVIE BY ID
exports.getMovieById = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return res.status(404).json({
        status: "error",
        message: "Data film tidak ditemukan.",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Data film berhasil diambil.",
      data: movie,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        status: "error",
        message: "ID film tidak valid.",
      });
    }

    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server.",
    });
  }
};

// CREATE MOVIE
exports.createMovie = async (req, res) => {
  try {
    if (req.file) {
      // Path yang disimpan: /img/posters/<movieId>.jpg
      req.body.poster = `/img/posters/${req.file.filename}`;

      if (req.generatedId) {
        req.body._id = req.generatedId;
      }
    }

    const movie = await Movie.create(req.body);

    res.status(201).json({
      status: "success",
      message: "Data film berhasil ditambahkan.",
      data: movie,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res
        .status(400)
        .json({ status: "error", message: messages.join(", ") });
    }
    res
      .status(500)
      .json({ status: "error", message: "Terjadi kesalahan pada server." });
  }
};

// UPDATE MOVIE
exports.updateMovieById = async (req, res) => {
  try {
    const existingMovie = await Movie.findById(req.params.id);

    if (!existingMovie) {
      return res.status(404).json({
        status: "error",
        message: "Data film tidak ditemukan.",
      });
    }

    if (req.file) {
      const posterDir = path.join(__dirname, "..", "public", "img", "posters");
      if (existingMovie.poster) {
        const oldFilename = path.basename(existingMovie.poster);
        const oldFilePath = path.join(posterDir, oldFilename);

        if (oldFilename !== req.file.filename && fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      req.body.poster = `/img/posters/${req.file.filename}`;
    }

    const updatedMovie = await Movie.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      },
    );

    res.status(200).json({
      status: "success",
      message: "Data film berhasil diperbarui.",
      data: updatedMovie,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);

      return res.status(400).json({
        status: "error",
        message: messages.join(", "),
      });
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        status: "error",
        message: "ID film tidak valid.",
      });
    }

    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server.",
      error: error.message,
    });
  }
};

// DELETE MOVIE
exports.deleteMovie = async (req, res) => {
  try {
    const movie = await Movie.findByIdAndDelete(req.params.id);

    if (!movie) {
      return res.status(404).json({
        status: "error",
        message: "Data film tidak ditemukan.",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Data film berhasil dihapus.",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        status: "error",
        message: "ID film tidak valid.",
      });
    }

    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server.",
    });
  }
};
