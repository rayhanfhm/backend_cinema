require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const path = require("path");
const morgan = require("morgan");

const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const movieRoutes = require("./routes/movieRouter");
const showtimeRouter = require("./routes/showtimeRouter");
const publicRoutes = require("./routes/publicRoutes");
const userController = require("./controllers/userController");
const { protect } = require("./middleware/authMiddleware");

const app = express();
const port = process.env.PORT || 1975;

connectDB();

// Mengizinkan semua Origin
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.set("trust proxy", 1);
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Server is running",
  });
});

app.get("/api/showtimes/:id/seats", userController.getShowtimeSeats);
app.post("/api/bookings", protect, userController.createBooking);
app.post("/api/bookings/midtrans-webhook", userController.midtransNotification);
app.get("/api/bookings", protect, userController.getUserBookings);
app.delete("/api/bookings/:bookingId", protect, userController.cancelBooking);

app.use("/api/public", publicRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/showtimes", showtimeRouter);
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);

if (require.main === module) {
  app.listen(port, "0.0.0.0", () => {
    console.log(`🚀 Server running on http://0.0.0.0:${port}`);
    console.log(`🌐 Accessible from any IP on port ${port}`);
  });
}

module.exports = app;
