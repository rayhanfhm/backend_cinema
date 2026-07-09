const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "Anda tidak diizinkan mengakses rute ini",
      });
    }

    // ANTI JWT INJECTION: Kunci algoritma hanya ke HS256
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });

    // Cek langsung ke database menggunakan email dari payload JWT
    const currentUser = await User.findOne({ email: decoded.email });

    if (!currentUser) {
      return res.status(401).json({
        status: "error",
        message: "Pengguna dengan token ini sudah tidak ditemukan",
      });
    }

    // Tolak akses jika penyerang mencoba memanipulasi role di JWT
    if (decoded.role && decoded.role !== currentUser.role) {
      return res.status(403).json({
        status: "error",
        message: "Integritas token gagal. Role tidak cocok dengan database!",
      });
    }

    // Simpan data asli dari database ke dalam request
    req.user = currentUser;
    next();
  } catch (error) {
    return res.status(401).json({
      status: "error",
      message: "Akses ditolak, token tidak valid atau kedaluwarsa",
    });
  }
};

exports.requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      status: "error",
      message: "Akses ditolak. Khusus Admin.",
    });
  }
  next();
};
