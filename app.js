require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");

// kode dennis
const authRoutes = require("./routes/authRoutes");

// kode step
const movieRoutes = require("./routes/movieRouter");
const showtimeRouter = require("./routes/showtimeRouter");
const publicRoutes = require("./routes/publicRoutes");
const userController = require("./controllers/userController");
const { protect } = require("./middleware/authMiddleware");

const app = express();
const port = process.env.PORT || 3000;

connectDB();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Server is running",
  });
});

// kode step
app.get("/api/showtimes/:id/seats", userController.getShowtimeSeats);
app.post("/api/bookings", protect, userController.createBooking);
app.get("/api/bookings", protect, userController.getUserBookings);
app.delete("/api/bookings/:bookingId", protect, userController.cancelBooking);

// kode step
app.use("/api/public", publicRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/showtimes", showtimeRouter);

// kode dennis
app.use("/api/auth", authRoutes);

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

module.exports = app;