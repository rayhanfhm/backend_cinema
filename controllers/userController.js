console.log("User controller loaded");
const Booking = require("../models/Booking");
const Showtime = require("../models/Showtime");

// Status kursi untuk showtime tertentu
const getShowtimeSeats = async (req, res) => {
    try {
        const {id} = req.params;

        // Cari showtime berdasarkan ID
        const showtime = await Showtime.findById(id);
        if (!showtime) {
            return res.status(404).json({message: "Showtime not available"});
        }

        // List kursi yang sudah dipesan untuk showtime tertentu
        res.status(200).json({
            showtimeId: showtime._id,
            studio: showtime.studio,
            price: showtime.price,
            bookedSeats: showtime.bookedSeats
        });
    } catch (error) {
        res.status(500).json({message: "Error retrieving showtime seats", error: error.message});
    }
};

/**
// Membuat booking baru; with API; perlu login user
 */

const createBooking = async (req, res) => {
    try {
        const {showtimeId, seats} = req.body;
        
        const userId = req.user._id; // Ambil user ID dari token yang sudah diverifikasi
        if (!showtimeId || !seats || !Array.isArray(seats) || seats.length === 0) {
            return res.status(400).json({message: "Invalid showtime or seats selection."});
        }

        // Cari showtime berdasarkan ID 
        const showtime = await Showtime.findById(showtimeId);
        if (!showtime) {
            return res.status(404).json({message: "Showtime not found."});
        }
        
        // Periksa apakah kursi yang dipilih sudah dipesan
        const conflictSeats = seats.filter(seat => showtime.bookedSeats.includes(seat));
        if (conflictSeats.length > 0) {
            return res.status(409).json({message: "One or more selected seats are no longer available.", unavailableSeats: conflictSeats});
        }

        //Perhitungan total harga berdasarkan jumlah kursi yang dipesan
        const totalPrice = seats.length * showtime.price;

        // Buat booking baru
        const newBooking = new Booking({
            user: userId,
            movieId: showtime.movieId,
            showtime: showtimeId,
            seats: seats,
            totalPrice: totalPrice,
            status: 'confirmed'
        });
        await newBooking.save();

        // Update bookedSeats pada showtime yang sudah dipesan
        showtime.bookedSeats.push(...seats);
        await showtime.save();

        res.status(201).json({
            message: "Booking created successfully.",
            bookingId: newBooking,
            totalPrice: totalPrice,
            bookedSeats: seats
        });

    } catch (error) {
        res.status(500).json({message: "Error creating booking", error: error.message});
    }
};

/**
 * Melihat riwayat pemesananan tiket user; with API; perlu login user
 */

const getUserBookings = async (req, res) => {
    try {
        const userId = req.user._id; 
        const bookings = await Booking.find({user: userId})
            .populate('movieId', 'title')
            .populate('showtime', 'studio date time')
            .sort({ createdAt: -1 });

        res.status(200).json({bookings: bookings});
    } catch (error) {
        res.status(500).json({message: "Error retrieving user bookings", error: error.message});
    }
};

/**
 * Membatalkan pesanan tiket user; with API; perlu login user
 */

const cancelBooking = async (req, res) => {
    try {
        const {bookingId} = req.params;
        const userId = req.user._id;

        // Cari booking 
        const booking = await Booking.findById(bookingId).populate('showtimeId');
        if (!booking) {
            return res.status(404).json({message: "Booking not found."});
        }

        // Periksa apakah booking yang dicancel milik user yang sedang login
        if (booking.user.toString() !== userId) {
            return res.status(403).json({message: "Unauthorized to cancel this booking."});
        }

        // Cek apakah sudah pernah dibatalkan sebelumnya
        if (booking.status === 'cancelled') {
            return res.status(400).json({message: "Booking has already been cancelled."});
        }

        // Buffer Pembatalan : 30 menit sebelum film dimulai
        const showtime = booking.showtimeId;
        if (!showtime) {
            return res.status(404).json({message: "Showtime data for this booking is missing."});
        }

        const movieDateStr = showtime.date.toISOString().split('T')[0];
        const movieTimeStr = showtime.time;
        const movieStartTime = new Date(`${movieDateStr}T${movieTimeStr}:00`);
        const cancellationDeadline = new Date(movieStartTime.getTime() - 30 * 60 * 1000);
        const currentTime = new Date();

        if (currentTime > cancellationDeadline) {
            return res.status(400).json({message: "Cancellation period has passed. You can only cancel up to 30 minutes before the movie starts."});
        }

        // Pembatalan booking jika lolos validasi
        booking.status = 'cancelled';
        await booking.save();

        // Update kursi yang sudah dibatalkan agar tersedia kembali
        showtime.bookedSeats = showtime.bookedSeats.filter(
            seat => !booking.seats.includes(seat));

        await showtime.save();

        res.status(200).json({message: "Booking cancelled successfully.", bookingId: booking._id, cancelledSeats: booking.seats});
    } catch (error) {
        res.status(500).json({message: "Server error", error: error.message});
    }
};

module.exports = {
    getShowtimeSeats,
    createBooking,
    getUserBookings,
    cancelBooking
};