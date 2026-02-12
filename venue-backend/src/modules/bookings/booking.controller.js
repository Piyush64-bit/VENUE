const mongoose = require('mongoose');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');
const Booking = require('./booking.model');
const Slot = require('../slots/slot.model');
const Waitlist = require('../waitlist/waitlist.model');
const Event = require('../events/event.model');
const User = require('../users/user.model');
const ApiResponse = require('../../utils/ApiResponse');

/**
 * BOOK SLOT (Quantity-based)
 */
/**
 * BOOK SLOT (Quantity-based)
 */
const bookSlot = catchAsync(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { slotId, quantity = 1, seats } = req.body;
    const userId = req.user._id;

    console.log("Create Booking Payload:", { slotId, quantity, seats, userId });

    if (quantity < 1) {
      throw new AppError("Quantity must be at least 1", 400);
    }

    if (!seats || !Array.isArray(seats)) {
      throw new AppError("Seats must be an array", 400);
    }

    if (!mongoose.Types.ObjectId.isValid(slotId)) {
      throw new AppError(`Invalid slotId: ${slotId}`, 400);
    }

    // 1. Fetch Slot with Parent for Validation
    // We need to check if the parent (Event/Movie) is PUBLISHED.
    const slotCheck = await Slot.findById(slotId).session(session);

    if (!slotCheck) {
      throw new AppError("Slot not found", 404);
    }

    // Dynamic populate based on parentType
    if (slotCheck.parentType === 'Event') {
      await slotCheck.populate('parentId');
    } else if (slotCheck.parentType === 'Movie') {
      await slotCheck.populate('parentId');
    }

    // Check if parent exists and is published
    if (!slotCheck.parentId || !slotCheck.parentId.isPublished) {
      throw new AppError("Event/Movie is not active or available for booking", 404);
    }

    // 2. Prevent duplicate booking (User Logic) - REMOVED
    // We want to allow users to book multiple times if they wish (e.g. buying more tickets later)
    // const existingBooking = await Booking.findOne({
    //   userId,
    //   slotId,
    //   status: "CONFIRMED",
    // }).session(session);

    // if (existingBooking) {
    //   throw new AppError("You have already booked this slot", 400);
    // }

    // 3. Atomic capacity check + decrement
    // Use availableSeats instead of remainingCapacity
    const slot = await Slot.findOneAndUpdate(
      {
        _id: slotId,
        availableSeats: { $gte: quantity },
      },
      {
        $inc: { availableSeats: -quantity },
      },
      { new: true, session }
    );

    // 4. Slot full? -> Add to Waitlist
    if (!slot) {
      const alreadyWaitlisted = await Waitlist.findOne({
        slotId,
        "users.userId": userId,
      }).session(session);

      if (!alreadyWaitlisted) {
        await Waitlist.findOneAndUpdate(
          { slotId },
          { $push: { users: { userId, quantity } } },
          { upsert: true, session }
        );
      }

      await session.commitTransaction();

      // Socket event
      const io = req.app.get("io");
      if (io) {
        io.to(userId.toString()).emit("waitlist:added", {
          slotId,
          quantity,
          message: "You have been added to the waitlist",
        });
      }

      return res.status(200).json({
        message: "Slot full or insufficient capacity. Added to waitlist.",
      });
    }

    // 5. Update Slot Status if needed
    if (slot.availableSeats === 0) {
      slot.status = "FULL";
      await slot.save({ session });
    }

    // 6. Create Booking
    const [booking] = await Booking.create([{
      userId,
      slotId,
      quantity,
      seats: seats || [], // Explicitly pass from body
      status: "CONFIRMED",
      paymentId: `PAY_${Date.now()}`,
      transactionId: `TXN_${Date.now()}_${Math.floor(Math.random() * 1000)}`
    }], { session });

    await session.commitTransaction();

    // Send Email Asynchronously (don't block response)
    // TODO: Implement email service
    // const user = await User.findById(userId);
    // emailService.sendBookingConfirmation(user, booking[0], slot, parent).catch(err => {
    //   console.error("Failed to send email", err);
    // });

    // Populate the booking before sending response
    await booking.populate({
      path: 'slotId',
      select: 'startTime endTime date parentId parentType price',
      populate: {
        path: 'parentId',
        select: 'title location image poster price'
      }
    });

    res.status(201).json(new ApiResponse(201, booking, 'Booking created successfully'));

  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    throw error;
  } finally {
    session.endSession();
  }
});

/**
 * GET SINGLE BOOKING
 */
const getBookingById = catchAsync(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw new AppError('Invalid Booking ID format', 400);
  }

  const booking = await Booking.findById(req.params.id)
    .populate({
      path: 'slotId',
      select: 'startTime endTime date parentId parentType price', // Added price
      populate: {
        path: 'parentId',
        select: 'title location image poster price' // Added price
      }
    });

  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  // Authorization check: Ensure user owns this booking
  if (booking.userId.toString() !== req.user.userId) {
    throw new AppError('Not authorized to view this booking', 403);
  }

  return res.status(200).json(new ApiResponse(200, booking, 'Booking details fetched successfully'));
});

/**
 * CANCEL BOOKING + PROMOTE WAITLIST
 */
const cancelBooking = catchAsync(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const bookingId = req.params.id;
    const userId = req.user._id;

    // 1. Find booking
    const booking = await Booking.findOne({
      _id: bookingId,
      userId,
      status: "CONFIRMED",
    }).session(session);

    if (!booking) {
      throw new AppError("Booking not found or already cancelled", 404);
    }

    // 2. Cancel booking
    booking.status = "CANCELLED";
    await booking.save({ session });

    // 3. Restore capacity
    const slot = await Slot.findByIdAndUpdate(
      booking.slotId,
      { $inc: { availableSeats: booking.quantity } },
      { new: true, session }
    );

    if (slot.availableSeats > 0) {
      slot.status = "AVAILABLE";
      await slot.save({ session });
    }

    // 4. Promote from waitlist if possible
    const waitlist = await Waitlist.findOne({ slotId: slot._id }).session(session);

    let promotedBooking = null;
    let nextUser = null;

    if (waitlist && waitlist.users.length > 0) {
      const userIndex = waitlist.users.findIndex(
        (u) => u.quantity <= slot.availableSeats
      );

      if (userIndex !== -1) {
        nextUser = waitlist.users[userIndex];

        // Deduct capacity again
        const updatedSlot = await Slot.findOneAndUpdate(
          { _id: slot._id, availableSeats: { $gte: nextUser.quantity } },
          { $inc: { availableSeats: -nextUser.quantity } },
          { new: true, session }
        );

        if (updatedSlot) {
          // Create Booking for promoted user
          const [newBooking] = await Booking.create([{
            userId: nextUser.userId,
            slotId: slot._id,
            quantity: nextUser.quantity,
            status: "CONFIRMED",
            paymentId: `PAY_WL_${Date.now()}`,
            transactionId: `TXN_WL_${Date.now()}`
          }], { session });

          promotedBooking = newBooking;

          // Update Slot status
          if (updatedSlot.availableSeats === 0) {
            updatedSlot.status = "FULL";
            await updatedSlot.save({ session });
          }

          // Remove the specific user from waitlist
          waitlist.users.splice(userIndex, 1);

          if (waitlist.users.length === 0) {
            await Waitlist.deleteOne({ _id: waitlist._id }).session(session);
          } else {
            await waitlist.save({ session });
          }
        }
      }
    }

    await session.commitTransaction();

    // Socket events
    const io = req.app.get("io");
    if (io && promotedBooking && nextUser) {
      io.to(nextUser.userId.toString()).emit("waitlist:promoted", {
        slotId: slot._id,
        bookingId: promotedBooking._id,
        quantity: nextUser.quantity,
        message: "You have been promoted from the waitlist",
      });
    }

    return res.status(200).json({
      status: 'success',
      message: promotedBooking
        ? "Booking cancelled. Waitlist user promoted."
        : "Booking cancelled successfully",
      data: {
        cancelledBooking: booking,
        promotedBooking: promotedBooking || null
      }
    });

  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    throw error;
  } finally {
    session.endSession();
  }
});

const getMyBookings = catchAsync(async (req, res, next) => {
  const userId = req.user._id;

  const bookings = await Booking.find({ userId })
    .populate({
      path: 'slotId',
      select: 'startTime endTime date parentId parentType',
      populate: {
        path: 'parentId',
        select: 'title location image poster'
      }
    })
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, { bookings, count: bookings.length }, "User bookings fetched successfully")
  );
});

const getOrganizerBookings = catchAsync(async (req, res, next) => {
  const organizerId = req.user._id;

  // 1. Find all events by this organizer
  const events = await Event.find({ organizerId }).select('_id title');
  const eventIds = events.map(event => event._id);

  if (eventIds.length === 0) {
    return res.status(200).json({
      status: 'success',
      results: 0,
      bookings: []
    });
  }

  // 2. Find all slots for these events
  const slots = await Slot.find({ eventId: { $in: eventIds } }).select('_id eventId startTime endTime date');
  const slotIds = slots.map(slot => slot._id);

  // 3. Find all bookings for these slots
  const bookings = await Booking.find({ slotId: { $in: slotIds } })
    .populate('userId', 'name email') // Get user info
    .populate({
      path: 'slotId',
      select: 'startTime endTime date eventId',
      populate: {
        path: 'eventId',
        select: 'title'
      }
    })
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    results: bookings.length,
    bookings
  });
});

module.exports = {
  bookSlot,
  getBookingById,
  cancelBooking,
  getMyBookings,
  getOrganizerBookings
};
