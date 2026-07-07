const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 3,
  message: {
    status: "error",
    message: "Terlalu banyak percobaan login. Silakan coba lagi nanti.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = loginLimiter;