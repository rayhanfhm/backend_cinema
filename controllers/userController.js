const Booking = require("../models/Booking");
const Showtime = require("../models/Showtime");

/**
 * HELPER FUNCTION: Generate Seat Layout
 * Menghasilkan array of objects untuk 40 kursi (A1-D10) beserta statusnya
 */
const generateSeatLayout = (bookedSeats = []) => {
  const rows = ["A", "B", "C", "D"];
  const seatsPerRow = 10;
  const seatLayout = [];

  for (let row of rows) {
    for (let num = 1; num <= seatsPerRow; num++) {
      const seatId = `${row}${num}`;
      seatLayout.push({
        id: seatId,
        status: bookedSeats.includes(seatId) ? "booked" : "available",
      });
    }
  }
  return seatLayout;
};

/**
 * 1. GET SHOWTIME SEATS (PUBLIC)
 */
const getShowtimeSeats = async (req, res) => {
  try {
    const { id } = req.params;

    const showtime = await Showtime.findById(id);
    if (!showtime) {
      return res.status(404).json({
        status: "error",
        message: "Showtime not found.",
      });
    }

    // Menggunakan helper function yang sudah dipisah
    const seatLayout = generateSeatLayout(showtime.bookedSeats);

    res.status(200).json({
      status: "success",
      message: "Seat data retrieved successfully.",
      data: {
        movieId: showtime.movieId,
        showtimeId: showtime._id,
        studio: showtime.studio,
        price: showtime.price,
        totalSeats: 40,
        layout: seatLayout,
      },
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

/**
 * 2. CREATE BOOKING (USER)
 */
const createBooking = async (req, res) => {
  try {
    const { showtimeId, seats } = req.body;
    const userId = req.user._id;

    if (!showtimeId || !seats || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Invalid showtime or seat selection.",
      });
    }

    const showtimeBase = await Showtime.findById(showtimeId);
    if (!showtimeBase) {
      return res
        .status(404)
        .json({ status: "error", message: "Showtime not found." });
    }

    // Validasi Waktu Logika
    const [startHours, startMinutes] = showtimeBase.time_start
      .split(":")
      .map(Number);
    const showTimeStart = new Date(showtimeBase.date);
    showTimeStart.setHours(startHours, startMinutes, 0, 0);
    const currentTime = new Date();

    if (currentTime >= showTimeStart) {
      return res.status(400).json({
        status: "error",
        message:
          "The showtime has already started or ended. Tickets cannot be booked.",
      });
    }

    // Atomic Update untuk mencegah Race Condition
    const updatedShowtime = await Showtime.findOneAndUpdate(
      {
        _id: showtimeId,
        bookedSeats: { $nin: seats },
      },
      {
        $push: { bookedSeats: { $each: seats } },
      },
      { new: true },
    );

    if (!updatedShowtime) {
      const currentShowtime = await Showtime.findById(showtimeId);
      const conflictSeats = seats.filter((seat) =>
        currentShowtime.bookedSeats.includes(seat),
      );

      return res.status(409).json({
        status: "error",
        message: "One or more selected seats are no longer available.",
        unavailableSeats: conflictSeats,
      });
    }

    const totalPrice = seats.length * showtimeBase.price;

    const newBooking = new Booking({
      userId,
      movieId: updatedShowtime.movieId,
      showtimeId,
      seats,
      totalPrice,
      status: "booked",
    });

    await newBooking.save();

    res.status(201).json({
      status: "success",
      message: "Booking created successfully. Please proceed to payment.",
      data: newBooking,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

/**
 * 3. PAY BOOKING (USER)
 */
const payBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user._id;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res
        .status(404)
        .json({ status: "error", message: "Booking not found." });
    }

    if (booking.userId.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ status: "error", message: "Access denied." });
    }

    if (booking.status === "paid") {
      return res
        .status(400)
        .json({
          status: "error",
          message: "This booking has already been paid.",
        });
    }
    if (booking.status === "cancelled") {
      return res
        .status(400)
        .json({
          status: "error",
          message: "This booking has already been cancelled.",
        });
    }

    booking.status = "paid";
    await booking.save();

    res.status(200).json({
      status: "success",
      message: "Payment successful. Your ticket is confirmed.",
      data: booking,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

/**
 * 4. GET USER BOOKINGS (USER)
 */
const getUserBookings = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status } = req.query;

    let query = { userId };

    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate("movieId", "title poster")
      .populate("showtimeId", "studio date time_start time_end")
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      message: "Booking history retrieved successfully.",
      data: bookings,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

/**
 * 5. CANCEL BOOKING (USER)
 */
const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user._id;

    const booking = await Booking.findById(bookingId).populate("showtimeId");
    if (!booking) {
      return res
        .status(404)
        .json({ status: "error", message: "Booking not found." });
    }

    if (booking.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        status: "error",
        message: "Access denied to cancel this booking.",
      });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({
        status: "error",
        message: "Booking is already cancelled.",
      });
    }

    const showtime = booking.showtimeId;
    if (!showtime) {
      return res.status(404).json({
        status: "error",
        message: "Showtime data not found.",
      });
    }

    // Validasi pembatalan maksimal 30 menit
    const [hours, minutes] = showtime.time_start.split(":").map(Number);
    const movieStartTime = new Date(showtime.date);
    movieStartTime.setHours(hours, minutes, 0, 0);
    const cancellationDeadline = new Date(
      movieStartTime.getTime() - 30 * 60 * 1000,
    );
    const currentTime = new Date();

    if (currentTime > cancellationDeadline) {
      return res.status(400).json({
        status: "error",
        message:
          "Cancellation deadline has passed. Tickets can only be cancelled up to 30 minutes before the movie starts.",
      });
    }

    await Showtime.findByIdAndUpdate(showtime._id, {
      $pull: { bookedSeats: { $in: booking.seats } },
    });

    booking.status = "cancelled";
    await booking.save();

    res.status(200).json({
      status: "success",
      message: "Booking cancelled successfully. Seats have been released.",
      cancelledSeats: booking.seats,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

module.exports = {
  getShowtimeSeats,
  createBooking,
  payBooking,
  getUserBookings,
  cancelBooking,
};
