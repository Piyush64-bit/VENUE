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
 *       400:
 *         description: Invalid ID
 *       404:
 *         description: Slot not found
 */
router.get(
    "/:id/seats",
    validateId('id'),
    getSlotSeats
);

module.exports = router;
