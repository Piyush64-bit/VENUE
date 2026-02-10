const Slot = require('./slot.model');
const Booking = require('../bookings/booking.model'); // Import Booking model
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');
const ApiResponse = require('../../utils/ApiResponse');

/**
 * GET SLOT SEATS
 * Returns list of booked seats for a slot + calculates available capacity
 */
const getSlotSeats = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    // 1. Check if slot exists
    const slot = await Slot.findById(id);
    if (!slot) {
        throw new AppError("Slot not found", 404);
    }

    // 2. Find all confirmed bookings for this slot
    const bookings = await Booking.find({
        slotId: id,
        status: 'CONFIRMED'
    }).select('seats');

    // 3. Aggregate booked seats
    // Handle both formats: ['A1', 'A2'] or [{label: 'A1'}, {label: 'A2'}]
    const bookedSeats = bookings.flatMap(b => {
        if (!b.seats) return [];
        return b.seats.map(s => typeof s === 'string' ? s : s.label);
    });

    // 4. Generate Seat Map (Static for now: Rows A-F, Cols 1-8)
    const rows = 6; // A-F
    const cols = 8; // 1-8
    const allSeats = [];

    for (let r = 0; r < rows; r++) {
        for (let c = 1; c <= cols; c++) {
            const rowLabel = String.fromCharCode(65 + r); // A, B, C...
            const seatLabel = `${rowLabel}${c}`;

            const isBooked = bookedSeats.includes(seatLabel);

            allSeats.push({
                _id: seatLabel, // Using label as ID for simplicity in frontend
                label: seatLabel,
                row: rowLabel,
                number: c,
                status: isBooked ? 'booked' : 'available'
            });
        }
    }

    // 5. Return response
    res.status(200).json(
        // Returning array directly as frontend expects array based on Seats.jsx:31
        allSeats
    );
});

module.exports = {
    getSlotSeats
};
