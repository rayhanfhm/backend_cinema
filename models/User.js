const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name must not be empty"],
    minlength: [5, "Nama minimal 5 karakter"],
    // Regex: Boleh huruf (a-z, A-Z), spasi (\s), dan titik (\.). Tidak boleh angka.
    match: [
      /^[a-zA-Z\s.]+$/,
      "Nama hanya boleh berisi huruf, spasi, dan titik. Angka tidak diperbolehkan.",
    ],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    // Regex:
    // (?=.*[a-zA-Z]) memastikan harus ada minimal 1 huruf
    // [a-zA-Z0-9.]+ memastikan hanya boleh huruf, angka, dan titik sebelum @
    // @gmail\.com$ memastikan wajib diakhiri dengan @gmail.com
    match: [
      /^(?=.*[a-zA-Z])[a-zA-Z0-9.]+@gmail\.com$/,
      "Email harus berakhiran @gmail.com, wajib mengandung huruf (tidak boleh full angka), dan tidak boleh ada karakter selain titik sebelum @",
    ],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [8, "Password minimal 8 karakter"],
    // Regex:
    // (?=.*[a-z]) minimal 1 huruf kecil
    // (?=.*[A-Z]) minimal 1 huruf besar
    // (?=.*\d) minimal 1 angka
    // (?=.*[^a-zA-Z0-9]) minimal 1 karakter spesial (selain huruf dan angka)
    match: [
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/,
      "Password harus mengandung huruf besar, huruf kecil, angka, dan minimal 1 karakter spesial",
    ],
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
 location: {
  type: String,
  required: [true, "Location wajib diisi"],
  minlength: [3, "Location minimal harus 3 karakter"],
  match: [
    /^[a-zA-Z\s.]+$/,
    "Location hanya boleh berisi huruf, spasi, dan titik"
  ]
},
  createdAt: {
    type: Date,
    default: Date.now,
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
});

// Middleware Mongoose: Hash password sebelum disimpan ke database
userSchema.pre("save", async function () {
  // Jika password tidak diubah/baru, lanjutkan saja
  if (!this.isModified("password")) return;

  // Hash password menggunakan bcrypt
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model("User", userSchema);
