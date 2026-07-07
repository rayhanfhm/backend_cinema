const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const loginLimiter = require("../middleware/loginLimiter");

router.post("/register", authController.register);
router.post('/login',loginLimiter, authController.login);

router.post("/logout", authMiddleware.protect, authController.logout);

// forgot password
router.post("/forgot-password", authController.forgotPassword);
// reset password
router.post("/reset-password/:token", authController.resetPassword);

module.exports = router;