const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        organizer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        isPublished: {
            type: Boolean,
            default: false,
        },
        poster: {
            type: String,
            required: true,
            default: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=800'
        },
        genre: {
            type: String,
            default: 'Drama'
        },
        rating: {
            type: Number,
            default: 0,
        },
        runtime: {
            type: String, // e.g. "2h 30m"
            required: true,
        },
        price: {
            type: Number,
            required: true,
            default: 250, // Standard movie ticket price
            min: 0
        },
        releaseDate: {
            type: Date,
            required: true,
        },
        status: {
            type: String,
            enum: ['NOW_SHOWING', 'COMING_SOON'],
            default: 'NOW_SHOWING'
        }
    },
    { timestamps: true }
);

// Indexes
movieSchema.index({ isPublished: 1, releaseDate: -1 }); // Public feed
movieSchema.index({ organizer: 1, createdAt: -1 }); // Organizer dashboard
movieSchema.index({ title: 'text' }); // Search

module.exports = mongoose.model('Movie', movieSchema);
