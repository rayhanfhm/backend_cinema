const Movie = require("../models/Movie");


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
    // Jika ada file yang di-upload, tambahkan path-nya ke req.body.poster
    if (req.file) {
      // Path yang disimpan: /img/posters/poster-1689...jpg
      req.body.poster = `/img/posters/${req.file.filename}`;
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
      return res.status(400).json({ status: "error", message: messages.join(", ") });
    }
    res.status(500).json({ status: "error", message: "Terjadi kesalahan pada server." });
  }
};

// UPDATE MOVIE
exports.updateMovieById = async (req, res) => {
  try {
    // Jika user meng-upload poster baru saat update, timpa path lamanya
    if (req.file) {
      req.body.poster = `/img/posters/${req.file.filename}`;
    }

    const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!movie) {
      return res.status(404).json({ status: "error", message: "Data film tidak ditemukan." });
    }

    res.status(200).json({
      status: "success",
      message: "Data film berhasil diperbarui.",
      data: movie,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ status: "error", message: messages.join(", ") });
    }
    if (error.name === "CastError") {
      return res.status(400).json({ status: "error", message: "ID film tidak valid." });
    }
    res.status(500).json({ status: "error", message: "Terjadi kesalahan pada server." });
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
