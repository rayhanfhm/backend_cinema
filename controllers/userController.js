console.log("User controller loaded");
const Booking = require("../models/Booking");
const Showtime = require("../models/Showtime");

/**
 * Controller untuk manajemen seat dan booking user
 */

const getShowtimeSeats = async (req, res) => {
  try {
    const { id } = req.params;

    const showtime = await Showtime.findById(id);
    if (!showtime) {
      return res.status(404).json({ message: "Showtime not available" });
    }

    res.status(200).json({
      showtimeId: showtime._id,
      studio: showtime.studio,
      price: showtime.price,
      bookedSeats: showtime.bookedSeats,
    });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving showtime seats", error: error.message });
  }
};

/**
 * Membuat booking baru untuk user yang sudah login
 */
const createBooking = async (req, res) => {
  try {
    const { showtimeId, seats } = req.body;
    const userId = req.user._id;

    if (!showtimeId || !seats || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({ message: "Invalid showtime or seats selection." });
    }

    const showtime = await Showtime.findById(showtimeId);
    if (!showtime) {
      return res.status(404).json({ message: "Showtime not found." });
    }

    const conflictSeats = seats.filter((seat) => showtime.bookedSeats.includes(seat));
    if (conflictSeats.length > 0) {
      return res.status(409).json({
        message: "One or more selected seats are no longer available.",
        unavailableSeats: conflictSeats,
      });
    }

    const totalPrice = seats.length * showtime.price;

    const newBooking = new Booking({
      userId,
      movieId: showtime.movieId,
      showtimeId,
      seats,
      totalPrice,
      status: "confirmed",
    });

    await newBooking.save();

    showtime.bookedSeats.push(...seats);
    await showtime.save();

    res.status(201).json({
      message: "Booking created successfully.",
      bookingId: newBooking._id,
      totalPrice,
      bookedSeats: seats,
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating booking", error: error.message });
  }
};

/**
 * Melihat riwayat booking user
 */
const getUserBookings = async (req, res) => {
  try {
    const userId = req.user._id;
    const bookings = await Booking.find({ userId })
      .populate("movieId", "title")
      .populate("showtimeId", "studio date time_start time_end")
      .sort({ createdAt: -1 });

    res.status(200).json({ bookings });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving user bookings", error: error.message });
  }
};

/**
 * Membatalkan booking user jika masih dalam batas waktu
 */
const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user._id;

    const booking = await Booking.findById(bookingId).populate("showtimeId");
    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    if (booking.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized to cancel this booking." });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({ message: "Booking has already been cancelled." });
    }

    const showtime = booking.showtimeId;
    if (!showtime) {
      return res.status(404).json({ message: "Showtime data for this booking is missing." });
    }

    const [hours, minutes] = showtime.time_start.split(":").map(Number);
    const movieStartTime = new Date(showtime.date);
    movieStartTime.setHours(hours, minutes, 0, 0);
    const cancellationDeadline = new Date(movieStartTime.getTime() - 30 * 60 * 1000);
    const currentTime = new Date();

    if (currentTime > cancellationDeadline) {
      return res.status(400).json({
        message: "Cancellation period has passed. You can only cancel up to 30 minutes before the movie starts.",
      });
    }

    booking.status = "cancelled";
    await booking.save();

    showtime.bookedSeats = showtime.bookedSeats.filter((seat) => !booking.seats.includes(seat));
    await showtime.save();

    res.status(200).json({
      message: "Booking cancelled successfully.",
      bookingId: booking._id,
      cancelledSeats: booking.seats,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getShowtimeSeats,
  createBooking,
  getUserBookings,
  cancelBooking,
};