const Movie = require("./movie.model");
const Slot = require("../slots/slot.model");
const generateSlots = require("../../utils/generateSlots");
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');
const ApiResponse = require('../../utils/ApiResponse');
const redisService = require('../../services/redis.service');

const createMovie = catchAsync(async (req, res, next) => {
    const useTransactions = process.env.NODE_ENV !== 'test';
    let session = null;

    if (useTransactions) {
        session = await Movie.startSession();
        session.startTransaction();
    }

    try {
        const {
            title,
            description,
            releaseDate,
            runtime,
            poster,
            genre,
            // Slot configuration (optional but recommended for booking)
            startDate, // e.g., "2023-10-27"
            endDate,   // e.g., "2023-11-27" (run for a month)
            slotDuration = 180, // 3 hours default
            capacityPerSlot = 100
        } = req.body;

        const movieData = {
            title,
            description,
            releaseDate,
            runtime,
            poster,
            genre,
            organizer: req.user._id
        };

        // 1. Create Movie
        let movie;
        if (useTransactions) {
            const [created] = await Movie.create([movieData], { session });
            movie = created;
        } else {
            movie = await Movie.create(movieData);
        }

        let createdSlots = [];

        // 2. Generate Slots if dates provided
        // Default to running for 2 weeks from release if not specified, 
        // to ensure immediate bookability.
        const effectiveStartDate = startDate || releaseDate;
        const effectiveEndDate = endDate || new Date(new Date(effectiveStartDate).setDate(new Date(effectiveStartDate).getDate() + 14));

        if (effectiveStartDate) {
            const slots = generateSlots(
                effectiveStartDate,
                effectiveEndDate,
                slotDuration,
                capacityPerSlot
            );

            // Attach parent references with correct Slot schema fields
            const slotsWithMovie = slots.map(slot => ({
                ...slot,
                parentType: 'Movie',
                parentId: movie._id,
                capacity: slot.remainingCapacity,
                availableSeats: slot.remainingCapacity,
            }));

            if (useTransactions) {
                createdSlots = await Slot.insertMany(slotsWithMovie, { session });
            } else {
                createdSlots = await Slot.insertMany(slotsWithMovie);
            }
        }

        if (useTransactions) await session.commitTransaction();
        await redisService.clearCache('movies:*');

        return res.status(201).json(
            new ApiResponse(201, { movie, slots: createdSlots }, "Movie created and slots generated successfully")
        );

    } catch (error) {
        if (useTransactions && session) {
            await session.abortTransaction();
        }
        throw error;
    } finally {
        if (useTransactions && session) {
            session.endSession();
        }
    }
});

const getMovies = catchAsync(async (req, res, next) => {
    // Only published movies
    const movies = await Movie.find({ isPublished: true }).sort({ releaseDate: -1 });
    return res.status(200).json(
        new ApiResponse(200, { results: movies.length, movies }, "Movies fetched successfully")
    );
});

const getMovieById = catchAsync(async (req, res, next) => {
    const movie = await Movie.findById(req.params.id);
    if (!movie || !movie.isPublished) {
        throw new AppError("Movie not found", 404);
    }
    return res.status(200).json(
        new ApiResponse(200, { movie }, "Movie fetched successfully")
    );
});

const getMovieSlots = catchAsync(async (req, res, next) => {
    const movie = await Movie.findById(req.params.id);
    if (!movie || !movie.isPublished) {
        throw new AppError("Movie not found", 404);
    }

    const slots = await Slot.find({
        parentId: req.params.id,
        parentType: 'Movie',
        availableSeats: { $gt: 0 } // Only available slots
    }).sort({ date: 1, startTime: 1 });

    return res.status(200).json(
        new ApiResponse(200, { slots }, "Movie slots fetched successfully")
    );
});

module.exports = { createMovie, getMovies, getMovieById, getMovieSlots };
