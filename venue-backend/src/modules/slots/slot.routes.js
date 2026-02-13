const express = require("express");
const { getSlotSeats } = require("./slot.controller");
const validateId = require("../../middlewares/validateId");

const router = express.Router();

/**
 * @swagger
 * /slots/{id}/seats:
 *   get:
 *     summary: Get seats for a slot
 *     tags: [Slots]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Slot ID
 *     responses:
 *       200:
 *         description: List of seats with status
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           seatNumber:
 *                             type: string
 *                           status:
 *                             type: string
 *                             enum: [AVAILABLE, BOOKED, BLOCKED]
 *       400:
 *         description: Invalid ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Slot not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
    "/:id/seats",
    validateId('id'),
    getSlotSeats
);

module.exports = router;
