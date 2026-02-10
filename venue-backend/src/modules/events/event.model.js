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
		isPublished: {
			type: Boolean,
			default: false,
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

// Indexes for common queries
eventSchema.index({ isPublished: 1, startDate: 1 }); // Public feed sorted by date
eventSchema.index({ organizerId: 1, createdAt: -1 }); // Organizer dashboard
eventSchema.index({ location: 1 }); // Filtering by location

module.exports = mongoose.model('Event', eventSchema);

