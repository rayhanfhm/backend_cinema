const Booking = require("../models/Booking");
const Showtime = require("../models/Showtime");
const Payment = require("../models/Payment");
const midtransClient = require("midtrans-client");
const { getShowtimeWindowWIB } = require("../utils/dateUtils");

const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY || "SB-Mid-server-XXXXX",
});

/**
 * HELPER FUNCTION: Generate Seat Layout
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
      return res
        .status(404)
        .json({ status: "error", message: "Showtime not found." });
    }

    const seatLayout = generateSeatLayout(showtime.bookedSeats);

    res.status(200).json({
      status: "success",
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
 * 2. CREATE BOOKING & MIDTRANS TOKEN (USER)
 */
const createBooking = async (req, res) => {
  try {
    const { showtimeId, seats } = req.body;
    const user = req.user;

    if (!showtimeId || !seats || !Array.isArray(seats) || seats.length === 0) {
      return res
        .status(400)
        .json({ status: "error", message: "Invalid selection." });
    }

    const showtimeBase = await Showtime.findById(showtimeId);
    if (!showtimeBase) {
      return res
        .status(404)
        .json({ status: "error", message: "Showtime not found." });
    }

    // 🔥 VALIDASI WAKTU (WIB, UTC+7)
    const { startAt, endAt } = getShowtimeWindowWIB(showtimeBase);
    const currentTime = new Date();

    // Kasus 1: film sudah mulai -> tutup booking
    if (currentTime >= startAt) {
      return res.status(400).json({
        status: "error",
        message:
          "Tiket tidak dapat dipesan karena film sudah dimulai atau jadwal telah berlalu.",
      });
    }

    // Kasus 2: jaring pengaman tambahan -> kalau karena alasan apa pun
    if (currentTime >= endAt) {
      return res.status(400).json({
        status: "error",
        message:
          "Tiket tidak dapat dipesan karena jadwal tayang sudah berakhir.",
      });
    }

    // Mengunci kursi di Showtime
    const updatedShowtime = await Showtime.findOneAndUpdate(
      { _id: showtimeId, bookedSeats: { $nin: seats } },
      { $push: { bookedSeats: { $each: seats } } },
      { new: true },
    );

    if (!updatedShowtime) {
      return res
        .status(409)
        .json({ status: "error", message: "Seats no longer available." });
    }

    const totalPrice = seats.length * showtimeBase.price;

    const newBooking = new Booking({
      userId: user._id,
      movieId: updatedShowtime.movieId,
      showtimeId,
      seats,
      totalPrice,
      status: "pending",
    });
    await newBooking.save();

    const orderId = `BKG-${newBooking._id}-${Date.now()}`;
   const parameter = {
     transaction_details: {
       order_id: orderId,
       gross_amount: totalPrice,
     },

     customer_details: {
       first_name: user.name,
       email: user.email,
     },

     item_details: [
       {
         id: showtimeId,
         price: showtimeBase.price,
         quantity: seats.length,
         name: `Ticket - Seats: ${seats.join(", ")}`,
       },
     ],

     callbacks: {
       finish: process.env.MIDTRANS_FINISH_REDIRECT,
     },
   };

    const transaction = await snap.createTransaction(parameter);

    const newPayment = new Payment({
      bookingId: newBooking._id,
      userId: user._id,
      orderId: orderId,
      grossAmount: totalPrice,
      snapToken: transaction.token,
      snapRedirectUrl: transaction.redirect_url,
    });
    await newPayment.save();

    res.status(201).json({
      status: "success",
      message: "Booking created. Please complete your payment.",
      data: {
        booking: newBooking,
        payment: newPayment,
      },
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

/**
 * 3. WEBHOOK MIDTRANS NOTIFICATION (SYSTEM)
 */
const midtransNotification = async (req, res) => {
  try {
    const notificationJson = req.body;

    const statusResponse =
      await snap.transaction.notification(notificationJson);
    const { order_id, transaction_status, payment_type } = statusResponse;

    const payment = await Payment.findOne({ orderId: order_id });
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    const booking = await Booking.findById(payment.bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    payment.paymentType = payment_type;
    payment.transactionStatus = transaction_status;

    if (
      transaction_status === "settlement" ||
      transaction_status === "capture"
    ) {
      booking.status = "paid";
    } else if (
      transaction_status === "cancel" ||
      transaction_status === "deny" ||
      transaction_status === "expire"
    ) {
      if (booking.status !== "cancelled") {
        booking.status = "cancelled";

        await Showtime.findByIdAndUpdate(booking.showtimeId, {
          $pull: { bookedSeats: { $in: booking.seats } },
        });
      }
    }

    await payment.save();
    await booking.save();

    res.status(200).json({ status: "success", message: "Webhook processed" });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

/**
 * 4. GET USER BOOKINGS (USER)
 */
/**
 * 4. GET USER BOOKINGS (USER)
 */
const getUserBookings = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status } = req.query;

    const query = {
      userId,
    };

    if (status) {
      query.status = status;
    }

    // Ambil semua booking user
     const bookings = await Booking.find(query)
       .populate("movieId", "title poster")
       .populate({
         path: "showtimeId",
         select: "movieId studio date time_start time_end",
         populate: {
           path: "movieId",
           select: "title poster",
         },
       })
       .sort({ createdAt: -1 });

    // Ambil semua payment user
    const payments = await Payment.find({
      userId,
    });

    // Mapping payment berdasarkan bookingId
    const paymentMap = {};

    payments.forEach((payment) => {
      paymentMap[payment.bookingId.toString()] = payment;
    });

    const results = bookings.map((booking) => {
      const payment = paymentMap[booking._id.toString()];

      let paymentInfo = null;

      if (payment) {
        // Sudah dibayar
        if (
          payment.transactionStatus === "settlement" ||
          payment.transactionStatus === "capture"
        ) {
          paymentInfo = {
            status: "paid",
            message: "Payment has been completed.",
            paymentType: payment.paymentType,
            orderId: payment.orderId,
            grossAmount: payment.grossAmount,
            paidAt: payment.updatedAt,
          };
        }

        // Masih pending -> kirim ulang snap supaya bisa lanjut bayar
        else if (payment.transactionStatus === "pending") {
          paymentInfo = {
            status: "pending",
            message: "Waiting for payment.",
            orderId: payment.orderId,
            grossAmount: payment.grossAmount,
            snapToken: payment.snapToken,
            snapRedirectUrl: payment.snapRedirectUrl,
            paymentType: payment.paymentType,
          };
        }

        // Expire
        else if (payment.transactionStatus === "expire") {
          paymentInfo = {
            status: "expire",
            message: "Payment has expired.",
            orderId: payment.orderId,
          };
        }

        // Cancel
        else if (payment.transactionStatus === "cancel") {
          paymentInfo = {
            status: "cancel",
            message: "Payment has been cancelled.",
            orderId: payment.orderId,
          };
        }

        // Deny
        else if (payment.transactionStatus === "deny") {
          paymentInfo = {
            status: "deny",
            message: "Payment was denied.",
            orderId: payment.orderId,
          };
        }
      }

      return {
        ...booking.toObject(),
        payment: paymentInfo,
      };
    });

    return res.status(200).json({
      status: "success",
      data: results,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};
/**
 * 5. CANCEL BOOKING (USER)
 */
const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user._id;

    const booking = await Booking.findById(bookingId);
    if (!booking)
      return res.status(404).json({ status: "error", message: "Not found." });
    if (booking.userId.toString() !== userId.toString())
      return res.status(403).json({ status: "error", message: "Denied." });
    if (booking.status === "cancelled")
      return res
        .status(400)
        .json({ status: "error", message: "Already cancelled." });
    if (booking.status === "paid")
      return res
        .status(400)
        .json({ status: "error", message: "Cannot cancel a paid booking." });

    const showtime = await Showtime.findById(booking.showtimeId);
    if (!showtime)
      return res
        .status(404)
        .json({ status: "error", message: "Showtime data not found." });

    // 🔥 Pakai helper yang sama dengan createBooking agar konsisten
    const { startAt } = getShowtimeWindowWIB(showtime);
    const cancellationDeadline = new Date(startAt.getTime() - 30 * 60 * 1000);
    const currentTime = new Date();

    if (currentTime > cancellationDeadline) {
      return res.status(400).json({
        status: "error",
        message:
          "Batas waktu pembatalan telah lewat (maksimal 30 menit sebelum film dimulai).",
      });
    }

    await Showtime.findByIdAndUpdate(booking.showtimeId, {
      $pull: { bookedSeats: { $in: booking.seats } },
    });

    booking.status = "cancelled";
    await booking.save();

    const payment = await Payment.findOne({
      bookingId: booking._id,
      transactionStatus: "pending",
    });

    if (payment) {
      try {
        await snap.transaction.cancel(payment.orderId);
        payment.transactionStatus = "cancel";
        await payment.save();
      } catch (e) {
        res.status(500).json({
          status: "error",
          message: e.message || "Failed to cancel payment with Midtrans.",
        });
        return;
      }
    }

    res.status(200).json({
      status: "success",
      message: "Cancelled successfully. Seats released.",
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

module.exports = {
  getShowtimeSeats,
  createBooking,
  midtransNotification,
  getUserBookings,
  cancelBooking,
};
