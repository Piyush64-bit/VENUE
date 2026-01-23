const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		slotId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Slot',
			required: true,
		},
		status: {
			type: String,
			enum: ['CONFIRMED', 'CANCELLED'],
			default: 'CONFIRMED',
		},
	},
	{ timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);

