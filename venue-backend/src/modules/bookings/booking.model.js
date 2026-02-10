const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    slotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Slot",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ["CONFIRMED", "CANCELLED"],
      default: "CONFIRMED",
    },
    seats: [{
      type: String,
      required: true
    }]
  },
  { timestamps: true }
);

// Indexes
bookingSchema.index({ userId: 1, createdAt: -1 }); // User history
bookingSchema.index({ slotId: 1, status: 1 }); // Slot capacity/duplication checks
bookingSchema.index({ userId: 1, slotId: 1, status: 1 }); // Duplicate booking prevention

module.exports = mongoose.model("Booking", bookingSchema);
