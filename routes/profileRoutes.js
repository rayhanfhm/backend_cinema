const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");
const { protect } = require("../middleware/authMiddleware");

// Semua rute profil wajib melewati proses autentikasi (login)
router.use(protect);

// Endpoint: GET /api/profile
router.get("/", profileController.getProfile);

// Endpoint: PUT /api/profile
router.put("/", profileController.updateProfile);

module.exports = router;
