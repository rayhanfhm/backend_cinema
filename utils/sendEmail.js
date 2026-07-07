const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  console.log("\n=== 🚀 MEMULAI PROSES KIRIM EMAIL ===");
  console.log("1. Konfigurasi Transporter...");

  // 1. Buat transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
    // FUNGSI DEBUG TAMBAHAN (Akan memunculkan log detail banget di terminal)
    debug: true,
    logger: true,
  });

  // 2. Verifikasi Koneksi (Ini akan mengecek apakah password dan port valid sebelum mencoba mengirim)
  try {
    console.log("2. Memverifikasi koneksi ke server SMTP Gmail...");
    await transporter.verify();
    console.log("✅ Koneksi SMTP Berhasil! Kredensial Valid.");
  } catch (verifyError) {
    console.error("❌ GAGAL KONEKSI SMTP:", verifyError.message);
    throw verifyError; // Lemparkan error agar ditangkap oleh controller
  }

  // 3. Tentukan isi emailnya
  const mailOptions = {
    from: `"Cinema Booking Admin" <${process.env.SMTP_EMAIL}>`,
    to: options.email,
    subject: `Request Forgot Password From IP: ${options.ip}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
        <h2 style="color: #333; text-align: center; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">Peringatan Keamanan Akun</h2>
        
        <p style="color: #555; font-size: 16px;">Halo,</p>
        <p style="color: #555; font-size: 16px; line-height: 1.5;">
          Kami mendeteksi adanya upaya permintaan <strong>reset password</strong> pada akun Anda. Berikut adalah rincian dari aktivitas tersebut:
        </p>
        
        <table style="width: 100%; margin: 20px 0; border-collapse: collapse; background-color: #f9f9f9;">
          <tr>
            <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold; width: 30%;">Waktu / Tanggal</td>
            <td style="padding: 12px; border: 1px solid #ddd;">${options.date}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Alamat IP Device</td>
            <td style="padding: 12px; border: 1px solid #ddd;">${options.ip}</td>
          </tr>
        </table>

        <p style="color: #555; font-size: 16px;">
          Jika ini memang Anda dan ingin mengubah password, silakan klik tombol di bawah ini:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${options.resetUrl}" style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">Ubah Password Sekarang</a>
        </div>

        <div style="background-color: #ffebee; padding: 15px; border-left: 4px solid #f44336; border-radius: 4px;">
          <p style="color: #d32f2f; margin: 0; font-weight: bold;">PENTING:</p>
          <p style="color: #d32f2f; margin: 5px 0 0 0; font-size: 14px;">Jika bukan Anda yang melakukan permintaan ini, <strong>abaikan pesan ini</strong>. Jangan klik tautan apa pun dan pastikan akun Anda tetap aman.</p>
        </div>
        
        <p style="color: #888; font-size: 14px; margin-top: 30px; text-align: center;">
          Terima kasih,<br><strong>Tim Keamanan Cinema Booking</strong>
        </p>
      </div>
    `,
  };

  // 4. Proses Pengiriman
  try {
    console.log(`3. Mengirim email ke: ${options.email}...`);
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ EMAIL BERHASIL TERKIRIM!");
    console.log("Message ID:", info.messageId);
    console.log("=== 🎉 PROSES SELESAI ===\n");
  } catch (sendError) {
    console.error("❌ GAGAL MENGIRIM EMAIL:", sendError.message);
    throw sendError;
  }
};

module.exports = sendEmail;
