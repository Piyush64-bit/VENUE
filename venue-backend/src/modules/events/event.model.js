const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: true,
		},
		description: {
			type: String,
		},
		organizerId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		startDate: {
			type: Date,
			required: true,
		},
		endDate: {
			type: Date,
			required: true,
		},
		status: {
			type: String,
			default: 'ACTIVE',
		},
		// Phase 8 Details
		image: {
			type: String,
			required: true,
			default: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30'
		},
		location: {
			type: String,
			default: 'Jaipur, Rajasthan'
		},
		price: {
			type: Number,
			default: 0
		},
		category: {
			type: String, // 'Music', 'Comedy', etc.
			default: 'General'
		}
	},
	{ timestamps: true }
);

// Indexes for performance
eventSchema.index({ price: 1, location: 1 }); // Composite index for common filters
eventSchema.index({ startDate: 1 }); // For date sorting/filtering

module.exports = mongoose.model('Event', eventSchema);

