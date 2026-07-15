const express = require("express");
const router = express.Router();
const publicController = require("../controllers/publicController");

router.get("/movies", publicController.getAllMovies);
router.get("/movies/:id", publicController.getMovieById);
router.get("/movies/:movieId/showtimes", publicController.getMovieShowtimes);

module.exports = router;
