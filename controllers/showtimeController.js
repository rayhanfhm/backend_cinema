const Showtime = require("../models/Showtime");
const Movie = require("../models/Movie");

// PUBLIK

// GET /api/movies/:movieId/showtimes
exports.getShowtimesByMovie = async (req, res) => {
  try {
    const showtimes = await Showtime.find({ movieId: req.params.movieId })
      .populate("movieId", "title genre duration rating")
      // PERBAIKAN: Menggunakan time_start untuk sorting
      .sort({ date: 1, time_start: 1 });

    res.status(200).json({
      status: "success",
      message: "Jadwal tayang berhasil diambil.",
      data: showtimes,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message || "Terjadi kesalahan pada server.",
    });
  }
};

// GET /api/showtimes/:id
exports.getShowtimeById = async (req, res) => {
  try {
    const showtime = await Showtime.findById(req.params.id).populate(
      "movieId",
      "title genre duration rating poster",
    );

    if (!showtime) {
      return res.status(404).json({
        status: "error",
        message: "Jadwal tayang tidak ditemukan",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Jadwal tayang berhasil diambil.",
      data: showtime,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message || "Terjadi kesalahan pada server.",
    });
  }
};

// GET /api/showtimes/:id/seats
exports.getShowtimeSeats = async (req, res) => {
  try {
    const showtime = await Showtime.findById(req.params.id);

    if (!showtime) {
      return res.status(404).json({
        status: "error",
        message: "Jadwal tayang tidak ditemukan",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Data kursi berhasil diambil.",
      data: {
        showtimeId: showtime._id,
        bookedSeats: showtime.bookedSeats,
      },
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// PRIVAT (ADMIN)

// POST /api/showtimes
exports.createShowtime = async (req, res) => {
  try {
    const movie = await Movie.findById(req.body.movieId);
    if (!movie) {
      return res.status(404).json({
        status: "error",
        message: "Film tidak ditemukan. Tidak dapat membuat jadwal.",
      });
    }

    // Validasi Logika Waktu: time_start tidak boleh >= time_end
    if (req.body.time_start && req.body.time_end) {
      if (req.body.time_start >= req.body.time_end) {
        return res.status(400).json({
          status: "error",
          message:
            "Waktu mulai (time_start) tidak boleh lebih dari atau sama dengan waktu selesai (time_end).",
        });
      }
    }

    const showtime = await Showtime.create(req.body);

    res.status(201).json({
      status: "success",
      message: "Jadwal tayang berhasil dibuat.",
      data: showtime,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res
        .status(400)
        .json({ status: "error", message: messages.join(", ") });
    }
    res.status(500).json({ status: "error", message: error.message });
  }
};

// PUT /api/showtimes/:id
exports.updateShowtime = async (req, res) => {
  try {
    // Ambil data lama terlebih dahulu untuk memvalidasi input parsial
    const existingShowtime = await Showtime.findById(req.params.id);
    if (!existingShowtime) {
      return res
        .status(404)
        .json({ status: "error", message: "Jadwal tayang tidak ditemukan" });
    }

    // Validasi Logika Waktu saat Update: Gabungkan data body dengan data lama
    const checkTimeStart = req.body.time_start || existingShowtime.time_start;
    const checkTimeEnd = req.body.time_end || existingShowtime.time_end;

    if (checkTimeStart >= checkTimeEnd) {
      return res.status(400).json({
        status: "error",
        message:
          "Waktu mulai (time_start) tidak boleh lebih dari atau sama dengan waktu selesai (time_end).",
      });
    }

    const showtime = await Showtime.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: "success",
      message: "Jadwal tayang berhasil diperbarui",
      data: showtime,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res
        .status(400)
        .json({ status: "error", message: messages.join(", ") });
    }
    res.status(500).json({ status: "error", message: error.message });
  }
};

// DELETE /api/showtimes/:id
exports.deleteShowtime = async (req, res) => {
  try {
    const showtime = await Showtime.findByIdAndDelete(req.params.id);

    if (!showtime) {
      return res
        .status(404)
        .json({ status: "error", message: "Jadwal tayang tidak ditemukan" });
    }

    res
      .status(200)
      .json({ status: "success", message: "Jadwal tayang berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
