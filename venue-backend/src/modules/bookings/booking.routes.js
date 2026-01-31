const express = require("express");
const {
  bookSlot,
  cancelBooking,
  getMyBookings,
  getOrganizerBookings
} = require("./booking.controller");

const verifyToken = require("../../middlewares/verifyToken");
const checkRole = require("../../middlewares/checkRole");

const router = express.Router();

// Book a slot
router.post(
  "/",
  verifyToken,
  checkRole(["USER"]),
  bookSlot
);

// Cancel booking
router.patch(
  "/:id/cancel",
  verifyToken,
  checkRole(["USER"]),
  cancelBooking
);

// Get my bookings (User)
router.get(
  "/my-bookings",
  verifyToken,
  getMyBookings
);

// Get bookings for my events (Organizer)
router.get(
  "/organizer",
  verifyToken,
  checkRole(["ORGANIZER", "ADMIN"]),
  getOrganizerBookings
);

module.exports = router;
