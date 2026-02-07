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
/**
 * @swagger
 * tags:
 *   name: Bookings
 *   description: Booking management
 */

// Book a slot
/**
 * @swagger
 * /bookings:
 *   post:
 *     summary: Book a slot for an event or movie
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventId
 *               - slotId
 *               - tickets
 *             properties:
 *               eventId:
 *                 type: string
 *               slotId:
 *                 type: string
 *               tickets:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Booking successful
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/",
  verifyToken,
  checkRole(["USER"]),
  bookSlot
);

// Cancel booking
/**
 * @swagger
 * /bookings/{id}/cancel:
 *   patch:
 *     summary: Cancel a booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 *       404:
 *         description: Booking not found
 *       401:
 *         description: Unauthorized
 */
router.patch(
  "/:id/cancel",
  verifyToken,
  checkRole(["USER"]),
  cancelBooking
);

// Get my bookings (User)
/**
 * @swagger
 * /bookings/my-bookings:
 *   get:
 *     summary: Get logged-in user's bookings
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user bookings
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/my-bookings",
  verifyToken,
  getMyBookings
);

// Get bookings for my events (Organizer)
/**
 * @swagger
 * /bookings/organizer:
 *   get:
 *     summary: Get bookings for organizer's events
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of bookings for organizer's events
 *       403:
 *         description: Forbidden (Organizer/Admin only)
 */
router.get(
  "/organizer",
  verifyToken,
  checkRole(["ORGANIZER", "ADMIN"]),
  getOrganizerBookings
);

module.exports = router;
