const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderId: {
      type: String,
      required: true,
      unique: true, 
    },
    grossAmount: {
      type: Number,
      required: true,
    },
    paymentType: {
      type: String,
      default: null,
    },
    transactionStatus: {
      type: String,
      enum: ["pending", "settlement", "expire", "cancel", "deny"],
      default: "pending",
    },
    snapToken: {
      type: String, 
      required: true,
    },
    snapRedirectUrl: {
      type: String, 
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Payment", paymentSchema);
