const multer = require("multer");
const path = require("path");

// 1. Tentukan tempat penyimpanan dan nama file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/img/posters"); // Pastikan folder ini sudah kamu buat!
  },
  filename: function (req, file, cb) {
    // Kita ganti namanya pakai timestamp biar unik dan aman
    const ext = path.extname(file.originalname);
    cb(null, `poster-${Date.now()}${ext}`);
  },
});

// 2. Kriteria & Validasi Keamanan
const fileFilter = (req, file, cb) => {
  // --- A. Cek Ekstensi Ganda (.jpg.php) ---
  const nameParts = file.originalname.split(".");
  // Kalau panjangnya lebih dari 2 (misal: ['gambar', 'jpg', 'php']), maka tolak!
  if (nameParts.length > 2) {
    return cb(
      new Error(
        "File name format is invalid. Double extensions are not allowed.",
      ),
      false,
    );
  }

  // --- B. Cek Tipe File (hanya jpg, jpeg, png) ---
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/jpg"];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error("Only JPG, JPEG, and PNG format allowed."), false);
  }

  cb(null, true);
};

// 3. Gabungkan pengaturan & set limit 10 MB
const uploadPoster = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB (dalam bytes)
  },
});

module.exports = uploadPoster;
