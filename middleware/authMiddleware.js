const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.protect = async (req, res, next) => {
   try {
     const token = req.cookies.jwt;

    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "Kamu harus login untuk mengakses resource ini.",
      });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const currentUser = await User.findById(decoded.userId);
    if (!currentUser) {
      return res.status(401).json({
        status: "error",
        message: "Pengguna yang terkait dengan token ini tidak lagi ada.",
      });
    }

    req.user = currentUser;
    next();
   } catch (error) {
     res.status(401).json({
       status: "error",
       message: "Token tidak valid. Silakan login kembali.",
     });
   }
}