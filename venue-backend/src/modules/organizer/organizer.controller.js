const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Event = require('../events/event.model');
const Movie = require('../movies/movie.model');
const Slot = require('../slots/slot.model');
const Booking = require('../bookings/booking.model');
const User = require('../users/user.model');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');
const ApiResponse = require('../../utils/ApiResponse');

/* ======================================================
   PROFILE & SETTINGS
   ====================================================== */

exports.getProfile = catchAsync(async (req, res, next) => {
    const organizer = await User.findById(req.user.userId).select('-password');

    if (!organizer) {
        return next(new AppError('Organizer not found', 404));
    }

    res.status(200).json(
        new ApiResponse(200, organizer, 'Profile retrieved successfully')
    );
});

exports.updateProfile = catchAsync(async (req, res, next) => {
    const { name, email } = req.body;

    // Check if email is being changed and if it already exists
    if (email && email !== req.user.email) {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return next(new AppError('Email already in use', 400));
        }
    }

    const updatedOrganizer = await User.findByIdAndUpdate(
        req.user.userId,
        { name, email },
        { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json(
        new ApiResponse(200, updatedOrganizer, 'Profile updated successfully')
    );
});

exports.changePassword = catchAsync(async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const organizer = await User.findById(req.user.userId).select('+password');

    if (!organizer) {
        return next(new AppError('Organizer not found', 404));
    }

    // Check current password
    const isPasswordCorrect = await bcrypt.compare(currentPassword, organizer.password);
    if (!isPasswordCorrect) {
        return next(new AppError('Current password is incorrect', 401));
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    organizer.password = hashedPassword;
    await organizer.save();

    res.status(200).json(
        new ApiResponse(200, null, 'Password changed successfully')
    );
});

exports.uploadImage = catchAsync(async (req, res, next) => {
    if (!req.file) {
        return next(new AppError('No image file uploaded', 400));
    }

    // Return the file URL
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    res.status(200).json(
        new ApiResponse(200, { url: imageUrl }, 'Image uploaded successfully')
    );
});


/* ======================================================
   EVENT MANAGMENT
   ====================================================== */

exports.getOrganizerStats = catchAsync(async (req, res, next) => {
    const organizerId = req.user.userId;

    // 1. Get all Events & Movies by this organizer
    const [events, movies] = await Promise.all([
        Event.find({ organizerId: organizerId }).select('_id title price'),
        Movie.find({ organizer: organizerId }).select('_id title price')
    ]);

    const eventIds = events.map(e => e._id);
    const movieIds = movies.map(m => m._id);
    const allParentIds = [...eventIds, ...movieIds];

    // 2. Get all Slots for these parents
    const slots = await Slot.find({ parentId: { $in: allParentIds } }).select('_id parentId parentType');
    const slotIds = slots.map(s => s._id);

    // 3. Get all CONFIRMED Bookings for these slots
    const bookings = await Booking.find({
        slotId: { $in: slotIds },
        status: 'CONFIRMED'
    });

    // 4. Calculate Stats
    const totalEvents = events.length;
    const totalMovies = movies.length;
    const totalTicketsSold = bookings.reduce((acc, b) => acc + b.quantity, 0);

    // Create lookup for price
    const priceMap = {};
    events.forEach(e => priceMap[e._id.toString()] = e.price || 0);
    movies.forEach(m => priceMap[m._id.toString()] = m.price || 0);

    // Slot to Parent lookup
    const slotParentMap = {};
    slots.forEach(s => slotParentMap[s._id.toString()] = s.parentId.toString());

    const totalRevenue = bookings.reduce((acc, b) => {
        const parentId = slotParentMap[b.slotId.toString()];
        const price = priceMap[parentId] || 0;
        return acc + (b.quantity * price);
    }, 0);

    // Popular Events (by tickets sold)
    // Group bookings by parentId via slot
    const popularity = {};
    bookings.forEach(b => {
        const parentId = slotParentMap[b.slotId.toString()];
        if (!popularity[parentId]) popularity[parentId] = 0;
        popularity[parentId] += b.quantity;
    });

    const popularContent = Object.entries(popularity)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([id, tickets]) => {
            const evt = events.find(e => e._id.toString() === id);
            const mov = movies.find(m => m._id.toString() === id);
            return {
                title: evt ? evt.title : (mov ? mov.title : 'Unknown'),
                type: evt ? 'Event' : 'Movie',
                tickets
            };
        });

    res.status(200).json({
        status: 'success',
        data: {
            totalEvents,
            totalMovies,
            totalTicketsSold,
            totalRevenue,
            popularContent
        }
    });
});

exports.uploadImage = catchAsync(async (req, res, next) => {
    if (!req.file) {
        return next(new AppError('No file uploaded', 400));
    }

    // Construct URL (Assuming localhost or simple deployment)
    // In production, this might be Cloudinary or S3 URL.
    // For local: http://localhost:PORT/uploads/filename
    const protocol = req.protocol;
    const host = req.get('host');
    const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

    res.status(200).json({
        status: 'success',
        data: {
            url: fileUrl
        }
    });
});

exports.createEvent = catchAsync(async (req, res, next) => {
    const eventData = {
        ...req.body,
        organizerId: req.user.userId, // Fixed: JWT uses userId, not id
        isPublished: false // Default to draft
    };

    const event = await Event.create(eventData);

    res.status(201).json(new ApiResponse(201, event, 'Event created successfully'));
});

exports.getMyEvents = catchAsync(async (req, res, next) => {
    const events = await Event.find({ organizerId: req.user.userId }).sort('-createdAt');

    res.status(200).json(new ApiResponse(200, events, 'Events retrieved successfully'));
});

exports.getEventById = catchAsync(async (req, res, next) => {
    const event = await Event.findOne({
        _id: req.params.id,
        organizerId: req.user.userId
    });

    if (!event) {
        return next(new AppError('Event not found or access denied', 404));
    }

    res.status(200).json(new ApiResponse(200, event, 'Event retrieved successfully'));
});

exports.updateEvent = catchAsync(async (req, res, next) => {
    // Prevent updating immutable fields
    const updates = { ...req.body };
    delete updates._id;
    delete updates.organizerId;
    delete updates.createdAt;
    delete updates.updatedAt;
    delete updates.__v;

    const event = await Event.findOneAndUpdate(
        { _id: req.params.id, organizerId: req.user.userId },
        updates,
        { new: true, runValidators: true }
    );

    if (!event) {
        return next(new AppError('Event not found or access denied', 404));
    }

    res.status(200).json(new ApiResponse(200, event, 'Event updated successfully'));
});

exports.deleteEvent = catchAsync(async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const event = await Event.findOneAndDelete(
            { _id: req.params.id, organizerId: req.user.userId }
        ).session(session);

        if (!event) {
            throw new AppError('Event not found or access denied', 404);
        }

        // Delete associated slots
        await Slot.deleteMany({ parentId: event._id, parentType: 'Event' }).session(session);

        await session.commitTransaction();
        res.status(200).json(new ApiResponse(200, null, 'Event and associated slots deleted successfully'));
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
});

exports.toggleEventPublish = catchAsync(async (req, res, next) => {
    const { publish } = req.body; // true to publish, false to unpublish

    const event = await Event.findOneAndUpdate(
        { _id: req.params.id, organizerId: req.user.userId },
        { isPublished: publish },
        { new: true }
    );

    if (!event) {
        return next(new AppError('Event not found or access denied', 404));
    }

    res.status(200).json(new ApiResponse(200, event, `Event ${publish ? 'published' : 'unpublished'} successfully`));
});

/* ======================================================
   MOVIE MANAGMENT
   ====================================================== */

exports.createMovie = catchAsync(async (req, res, next) => {
    const movieData = {
        ...req.body,
        organizer: req.user.userId, // Enforce ownership
        isPublished: false
    };

    const movie = await Movie.create(movieData);

    res.status(201).json(new ApiResponse(201, movie, 'Movie created successfully'));
});

exports.getMyMovies = catchAsync(async (req, res, next) => {
    const movies = await Movie.find({ organizer: req.user.userId }).sort('-createdAt');

    res.status(200).json(new ApiResponse(200, movies, 'Movies retrieved successfully'));
});

exports.getMovieById = catchAsync(async (req, res, next) => {
    const movie = await Movie.findOne({
        _id: req.params.id,
        organizer: req.user.userId
    });

    if (!movie) {
        return next(new AppError('Movie not found or access denied', 404));
    }

    res.status(200).json(new ApiResponse(200, movie, 'Movie retrieved successfully'));
});

exports.updateMovie = catchAsync(async (req, res, next) => {
    // Prevent updating immutable fields
    const updates = { ...req.body };
    delete updates._id;
    delete updates.organizer; // Movie uses 'organizer' field
    delete updates.createdAt;
    delete updates.updatedAt;
    delete updates.__v;

    const movie = await Movie.findOneAndUpdate(
        { _id: req.params.id, organizer: req.user.userId },
        updates,
        { new: true, runValidators: true }
    );

    if (!movie) {
        return next(new AppError('Movie not found or access denied', 404));
    }

    res.status(200).json(new ApiResponse(200, movie, 'Movie updated successfully'));
});

exports.deleteMovie = catchAsync(async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const movie = await Movie.findOneAndDelete(
            { _id: req.params.id, organizer: req.user.userId }
        ).session(session);

        if (!movie) {
            throw new AppError('Movie not found or access denied', 404);
        }

        // Delete associated slots
        await Slot.deleteMany({ parentId: movie._id, parentType: 'Movie' }).session(session);

        await session.commitTransaction();
        res.status(200).json(new ApiResponse(200, null, 'Movie and associated slots deleted successfully'));
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
});

exports.toggleMoviePublish = catchAsync(async (req, res, next) => {
    const { publish } = req.body;

    const movie = await Movie.findOneAndUpdate(
        { _id: req.params.id, organizer: req.user.userId },
        { isPublished: publish },
        { new: true }
    );

    if (!movie) {
        return next(new AppError('Movie not found or access denied', 404));
    }

    res.status(200).json(new ApiResponse(200, movie, `Movie ${publish ? 'published' : 'unpublished'} successfully`));
});

/* ======================================================
   SLOT MANAGMENT
   ====================================================== */

exports.createSlot = catchAsync(async (req, res, next) => {
    let { parentType, parentId, capacity } = req.body;

    // Handle route params for context-aware creation
    if (req.params.eventId) {
        parentId = req.params.eventId;
        parentType = 'Event';
    } else if (req.params.movieId) {
        parentId = req.params.movieId;
        parentType = 'Movie';
    }

    if (!parentType || !parentId) {
        return next(new AppError('Parent type and ID are required', 400));
    }

    // Verify ownership of parent
    let parent;
    if (parentType === 'Event') {
        parent = await Event.findOne({ _id: parentId, organizerId: req.user.userId });
    } else if (parentType === 'Movie') {
        parent = await Movie.findOne({ _id: parentId, organizer: req.user.userId });
    } else {
        return next(new AppError('Invalid parent type', 400));
    }

    if (!parent) {
        return next(new AppError('Parent resource not found or access denied', 404));
    }

    const slotData = {
        ...req.body,
        parentType,
        parentId,
        availableSeats: capacity // Initial availability = capacity
    };

    const slot = await Slot.create(slotData);

    res.status(201).json(new ApiResponse(201, slot, 'Slot created successfully'));
});

exports.getSlotsByParent = catchAsync(async (req, res, next) => {
    let { parentType, parentId } = req.params;

    // Handle route params
    if (req.params.eventId) {
        parentId = req.params.eventId;
        parentType = 'Event';
    } else if (req.params.movieId) {
        parentId = req.params.movieId;
        parentType = 'Movie';
    }

    // Optional: Verify ownership if strictly private, or allow reading
    // For now, let's allow organizer to read their own slots
    // Re-verify parent ownership for security
    let parent;
    if (parentType === 'Event') {
        parent = await Event.findOne({ _id: parentId, organizerId: req.user.userId });
    } else if (parentType === 'Movie') {
        parent = await Movie.findOne({ _id: parentId, organizer: req.user.userId });
    }

    if (!parent) {
        return next(new AppError('Parent resource not found or access denied', 404));
    }

    const slots = await Slot.find({ parentId, parentType });

    res.status(200).json(new ApiResponse(200, slots, 'Slots retrieved successfully'));
});

exports.deleteSlot = catchAsync(async (req, res, next) => {
    // Find slot to get parent and check ownership
    const slot = await Slot.findById(req.params.id);

    if (!slot) {
        return next(new AppError('Slot not found', 404));
    }

    // check ownership
    let parent;
    if (slot.parentType === 'Event') {
        parent = await Event.findOne({ _id: slot.parentId, organizerId: req.user.userId });
    } else if (slot.parentType === 'Movie') {
        parent = await Movie.findOne({ _id: slot.parentId, organizer: req.user.userId });
    }

    if (!parent) {
        return next(new AppError('Access denied', 403));
    }

    // Check for active bookings
    const Booking = require('../bookings/booking.model');
    const activeBookings = await Booking.countDocuments({
        slotId: req.params.id,
        status: 'CONFIRMED'
    });

    if (activeBookings > 0) {
        return next(new AppError('Cannot delete slot with active bookings', 409));
    }

    await Slot.findByIdAndDelete(req.params.id);

    res.status(200).json(new ApiResponse(200, null, 'Slot deleted successfully'));
});
exports.updateSlot = catchAsync(async (req, res, next) => {
    // 1. Find slot
    const slot = await Slot.findById(req.params.id);
    if (!slot) {
        return next(new AppError('Slot not found', 404));
    }

    // 2. Verify Ownership via Parent
    let parent;
    if (slot.parentType === 'Event') {
        parent = await Event.findOne({ _id: slot.parentId, organizerId: req.user.userId });
    } else if (slot.parentType === 'Movie') {
        parent = await Movie.findOne({ _id: slot.parentId, organizer: req.user.userId });
    }

    if (!parent) {
        return next(new AppError('Access denied', 403));
    }

    // 3. Update
    // Prevent updating parentId/parentType to move slots between events (complexity)
    delete req.body.parentId;
    delete req.body.parentType;

    const updatedSlot = await Slot.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    );

    res.status(200).json(new ApiResponse(200, updatedSlot, 'Slot updated successfully'));
});
