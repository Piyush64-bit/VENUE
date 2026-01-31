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

module.exports = mongoose.model('Movie', movieSchema);
