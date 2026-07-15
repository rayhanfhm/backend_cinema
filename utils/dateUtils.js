const WIB_OFFSET = "+07:00";

/**
 * Memastikan format waktu selalu 2 digit, misal "8:0" -> "08:00"
 */
const formatTime = (timeStr) => {
  const [h, m] = timeStr.split(":");
  return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
};

/**
 * Mengambil rentang waktu tayang (mulai & selesai) sebagai objek Date,
 * yang sudah dikunci secara eksplisit ke zona waktu WIB (UTC+7),
 * TIDAK BERGANTUNG pada timezone server tempat aplikasi ini dijalankan.
 *
 * @param {Object} showtime - dokumen Showtime (butuh field: date, time_start, time_end)
 * @returns {{ startAt: Date, endAt: Date }}
 */
const getShowtimeWindowWIB = (showtime) => {
  // Ambil bagian tanggal murni (YYYY-MM-DD) dari field `date`
  const dateStr = new Date(showtime.date).toISOString().split("T")[0];

  const startTimeStr = formatTime(showtime.time_start);
  const endTimeStr = formatTime(showtime.time_end);

  const startAt = new Date(`${dateStr}T${startTimeStr}:00${WIB_OFFSET}`);
  let endAt = new Date(`${dateStr}T${endTimeStr}:00${WIB_OFFSET}`);

  if (endAt <= startAt) {
    endAt = new Date(endAt.getTime() + 24 * 60 * 60 * 1000);
  }

  return { startAt, endAt };
};

module.exports = { getShowtimeWindowWIB };
