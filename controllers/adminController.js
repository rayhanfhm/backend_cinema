const Users = require("../models/User");
const Bookings = require("../models/Booking");
const Payments = require("../models/Payment");

/**
 * ==========================================
 * GET ALL USERS
 * ==========================================
 */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await Users.find().sort({ createdAt: -1 });

    const data = users.map((user) => ({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    res.status(200).json({
      status: "success",
      totalData: data.length,
      data,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

/**
 * ==========================================
 * GET ALL BOOKINGS
 * ==========================================
 */
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Bookings.find()
      .populate("userId", "name email")
      .populate("movieId", "title")
      .populate("showtimeId", "studio date time_start time_end")
      .sort({ createdAt: -1 });

    const data = bookings.map((booking) => ({
      id: booking._id,
      user: booking.userId,
      movie: booking.movieId,
      showtime: booking.showtimeId,
      seats: booking.seats,
      totalPrice: booking.totalPrice,
      status: booking.status,
      createdAt: booking.createdAt,
    }));

    res.status(200).json({
      status: "success",
      totalData: data.length,
      data,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

/**
 * ==========================================
 * GET ALL PAYMENTS
 * ==========================================
 */
exports.getAllPayments = async (req, res) => {
  try {
    const payments = await Payments.find()
      .populate("userId", "name email")
      .populate("bookingId")
      .sort({ createdAt: -1 });

    const data = payments.map((payment) => ({
      id: payment._id,
      booking: payment.bookingId,
      user: payment.userId,
      orderId: payment.orderId,
      grossAmount: payment.grossAmount,
      paymentType: payment.paymentType,
      transactionStatus: payment.transactionStatus,
      snapToken: payment.snapToken,
      snapRedirectUrl: payment.snapRedirectUrl,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    }));

    res.status(200).json({
      status: "success",
      totalData: data.length,
      data,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};
