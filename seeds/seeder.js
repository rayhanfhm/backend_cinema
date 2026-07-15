require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

// Koneksi ke Database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected for Seeding...");
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
};

const seedAdmin = async () => {
  await connectDB();

  try {
    const adminEmail = process.env.EMAIL;
    const adminPassword = process.env.PASSWORD || "defaultAdminPassword123@"; 

    // Cek apakah admin sudah ada agar tidak terjadi duplikasi saat script dijalankan ulang
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log("⚠️ Akun Admin sudah ada di database!");
      process.exit();
    }

    // Hash password sebelum disimpan
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    // Buat data Admin
    const adminUser = {
      name: "Super Admin",
      email: adminEmail,
      password: hashedPassword,
      location: "Jakarta",
      role: "admin",
    };

    // Simpan ke database
    await User.create(adminUser);

    console.log("✅ Akun Admin berhasil dibuat!");
    process.exit();
  } catch (error) {
    console.error("❌ Gagal membuat akun Admin:", error);
    process.exit(1);
  }
};

// Jalankan fungsi
seedAdmin();
