const express = require("express");
const router = express.Router();
const showtimeController = require("../controllers/showtimeController");
const authMiddleware = require("../middleware/authMiddleware");


// Public routes

// Mengambil seluruh jadwal tayang berdasarkan film
router.get("/movie/:movieId", showtimeController.getShowtimesByMovie);

// Mengambil detail satu jadwal tayang
router.get("/:id", showtimeController.getShowtimeById);

// Mengambil kursi yang sudah dipesan
router.get("/:id/seats", showtimeController.getShowtimeSeats);

// Admin routes
// Menambah jadwal tayang baru
router.post(
  "/add-showtime",
  authMiddleware.protect,
  authMiddleware.requireAdmin,
  showtimeController.createShowtime
);

// Mengupdate jadwal tayang
router.put(
  "/update-showtime/:id",
  authMiddleware.protect,
  authMiddleware.requireAdmin,
  showtimeController.updateShowtime
);

// Menghapus jadwal tayang
router.delete(
  "/delete-showtime/:id",
  authMiddleware.protect,
  authMiddleware.requireAdmin,
  showtimeController.deleteShowtime
);

module.exports = router;