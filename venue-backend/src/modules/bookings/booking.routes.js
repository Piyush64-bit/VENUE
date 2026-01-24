const express = require("express");
const {
  bookSlot,
  cancelBooking
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

module.exports = router;
