const User = require("../models/User");

// GET USER PROFILE
exports.getProfile = async (req, res) => {
  try {
    // Ambil data user berdasarkan ID dari token (req.user diset oleh middleware protect)
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found.",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Profile retrieved successfully.",
      data: user,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// UPDATE USER PROFILE
exports.updateProfile = async (req, res) => {
  try {
    // SECURITY CHECK: Blokir keras jika mencoba mengubah role
    if (req.body.role) {
      return res.status(403).json({
        status: "error",
        message: "Access denied. You are not allowed to change your role.",
      });
    }

    // SECURITY CHECK: Blokir jika mencoba mengubah password lewat rute ini
    if (req.body.password) {
      return res.status(400).json({
        status: "error",
        message: "Please use the specific route to change your password.",
      });
    }

    // Hanya ambil field yang diizinkan untuk diubah (mencegah injeksi data ilegal)
    const allowedUpdates = {
      name: req.body.name,
      email: req.body.email,
    };

    // Hapus properti yang undefined agar tidak menimpa data di database menjadi null/kosong
    Object.keys(allowedUpdates).forEach(
      (key) => allowedUpdates[key] === undefined && delete allowedUpdates[key],
    );

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      allowedUpdates,
      {
        new: true,
        runValidators: true,
      },
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        status: "error",
        message: "User not found.",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Profile updated successfully.",
      data: updatedUser,
    });
  } catch (error) {
    // Tangkap error jika email yang dimasukkan sudah dipakai oleh orang lain (Duplicate Key)
    if (error.code === 11000) {
      return res.status(400).json({
        status: "error",
        message: "Email is already in use by another account.",
      });
    }
    res.status(500).json({ status: "error", message: error.message });
  }
};
