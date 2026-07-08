require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
// dennis import
const movieRoutes = require("./routes/movieRouter");

// step import


const app = express();
const port = process.env.PORT || 3000;

// connect ke database
connectDB();

// middleware global
app.use (cors({
  origin: "http://localhost:3000",
  credentials: true,
}))

app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Server is running",
  });
});

// Step kode

// Dennis kode
app.use("/api/movies", movieRoutes);

// Pasang routes ke prefix /api/auth
app.use('/api/auth', authRoutes);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
