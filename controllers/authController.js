const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

exports.register = async (req, res) => {
    try {
        const { name, email, password, passwordConfirm,location } = req.body;
        // validasi password
        if (password !== passwordConfirm) {
      return res.status(400).json({ 
        status: 'error',
        message: 'Password and Confirm Password must match' 
      });
    }

    // cek email sudah terdaftar atau belum
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ 
        status: 'error',
        message: 'Duplicate email registration'
      });
    }

    // buat user baru
    const user = await User.create({
      name,
      email,
      password,
      location,
      role: 'user' 
    });
    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        userId: user._id,
        name: user.name,
        email: user.email,
        location: user.location,
        role: user.role
      }
    });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: error.message,
        })
    }
}

// login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // validasi input
    if (!email || !password) {
      return res.status(400).json({
        status: "error",
        message: "Email and password are required",
      });
    }

    // cari user nya berdasarkan email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password",
      });
    }

    // bandingkan password nya
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password",
      });
    }

    // buat token JWT
    const payload = {
      userId: user._id,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    const cookieOptions = {
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
      ),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    };

    res.cookie("jwt", token, cookieOptions);

    res.status(200).json({
      status: "success",
      message: "Logged in successfully",
      token: token,
      data: {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
}


// logout
exports.logout = (req, res) => {
    res.clearCookie("jwt");
    res.status(200).json({
      status: "success",
      message: "Logged out successfully",
    });
}

exports.forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "Tidak ada user dengan email tersebut atau Email tidak aktif. Silakan cek kembali email yang kamu masukkan.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const userIp = req.headers["x-forwarded-for"] || req.ip;
    const currentDate = new Date().toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
      dateStyle: "full",
      timeStyle: "long",
    });

    try {
      await sendEmail({
        email: user.email,
        ip: userIp,
        date: currentDate,
        resetUrl: resetUrl,
      });

      res.status(200).json({
        status: "success",
        message: "Link reset password berhasil dikirim ke email kamu!",
      });
    } catch (error) {
      // Reset field jika pengiriman email gagal
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      res.status(500).json({
        status: "error",
        message: "Gagal mengirim email peringatan. Silakan coba lagi.",
      });
    }
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

exports.resetPassword = async (req, res) => {
    try {
      const resetToken = req.params.token;
      const hashedToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

      const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpire: { $gt: Date.now() },
      });

      if (!user) {
        return res.status(400).json({
          status: "error",
          message: "Token tidak valid atau sudah kedaluwarsa.",
        });
      }

      // ambil password baru
      const { password, passwordConfirm } = req.body;

      if (password !== passwordConfirm) {
        return res.status(400).json({
          status: "error",
          message: "Password dan konfirmasi password tidak cocok.",
        });
      }
      user.password = password;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save();

      const payload = {
        userId: user._id,
        email: user.email,
        role: user.role,
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
      });

      const cookieOptions = {
        expires: new Date(
          Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
        ),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      };

      res.cookie("jwt", token, cookieOptions);

      res.status(200).json({
        status: "success",
        message: "Password berhasil diubah. Anda sudah otomatis login.",
      });
    } catch (error) {
      // Tangkap error jika password baru tidak lolos validasi Regex
      if (error.name === "ValidationError") {
        const messages = Object.values(error.errors).map((err) => err.message);
        return res.status(400).json({
          status: "error",
          message: messages.join(", "),
        });
      }

      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
}