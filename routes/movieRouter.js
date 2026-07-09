const express = require("express");
const router = express.Router();
const movieController = require("../controllers/movieController");
const showtimeController = require("../controllers/showtimeController");
const authMiddleware = require("../middleware/authMiddleware");
const uploadPoster = require("../middleware/uploadMiddleware");

// public routes
router.get("/", movieController.getAllMovies);
router.get("/:id", movieController.getMovieById);

// Admin routes
router.post(
  "/add-movie",
  authMiddleware.protect,
  authMiddleware.requireAdmin,
  uploadPoster.single("poster"),
  movieController.createMovie,
);

router.put(
  "/update-movie/:id",
  authMiddleware.protect,
  authMiddleware.requireAdmin,
  movieController.updateMovieById,
);

router.delete(
  "/delete-movie/:id",
  authMiddleware.protect,
  authMiddleware.requireAdmin,
  movieController.deleteMovie,
);

router.get("/:movieId/showtimes", showtimeController.getShowtimesByMovie);

module.exports = router;
