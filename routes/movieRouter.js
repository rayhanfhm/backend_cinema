const express = require("express");
const router = express.Router();
const movieController = require("../controllers/movieController");
const authMiddleware = require("../middleware/authMiddleware");

// public routes
router.get("/", movieController.getAllMovies);
router.get("/:id", movieController.getMovieById);

// Admin routes
router.post(
  "/add-movie",
  authMiddleware.protect,
  authMiddleware.requireAdmin,
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

module.exports = router;
