const mongoose = require('mongoose');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');
const Booking = require('./booking.model');
const Slot = require('../slots/slot.model');
const Waitlist = require('../waitlist/waitlist.model');
const Event = require('../events/event.model');

/**
 * BOOK SLOT (Quantity-based)
 */
const bookSlot = catchAsync(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { slotId, quantity = 1 } = req.body;
    const userId = req.user.userId; // Provided by verifyToken

    if (quantity < 1) {
      throw new AppError("Quantity must be at least 1", 400);
    }

    // 1. Prevent duplicate booking
    const existingBooking = await Booking.findOne({
      userId,
      slotId,
      status: "CONFIRMED",
    }).session(session);

    if (existingBooking) {
      throw new AppError("You have already booked this slot", 400);
    }

    // 2. Atomic capacity check + decrement
    // We pass the session to ensure this happens within the transaction
    const slot = await Slot.findOneAndUpdate(
      {
        _id: slotId,
        remainingCapacity: { $gte: quantity },
      },
      {
        $inc: { remainingCapacity: -quantity },
      },
      { new: true, session }
    );

    // 3. Slot full? -> Add to Waitlist (Logic simplification: If slot update failed, we check waitlist)
    if (!slot) {
      // Check concurrency again or just proceed to waitlist logic
      // Note: Waitlist operations are ALSO inside the transaction for safety
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

      // Socket event (Fire after commit)
      const io = req.app.get("io");
      io.to(userId.toString()).emit("waitlist:added", {
        slotId,
        quantity,
        message: "You have been added to the waitlist",
      });

      return res.status(200).json({
        message: "Slot full or insufficient capacity. Added to waitlist.",
      });
    }

    // 4. Update Slot Status if needed
    if (slot.remainingCapacity === 0) {
      slot.status = "FULL";
      await slot.save({ session });
    }

    // 5. Create Booking
    const booking = await Booking.create([{
      userId,
      slotId,
      quantity,
      seats: req.body.seats || [], // Save seats if provided
      status: "CONFIRMED",
    }], { session });

    await session.commitTransaction();

    return res.status(201).json({
      status: 'success',
      message: "Booking confirmed",
      data: { booking: booking[0] },
    });

  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

/**
 * CANCEL BOOKING + PROMOTE WAITLIST
 */
/**
 * CANCEL BOOKING + PROMOTE WAITLIST
 */
const cancelBooking = catchAsync(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const bookingId = req.params.id;
    const userId = req.user.userId;

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
      { $inc: { remainingCapacity: booking.quantity } },
      { new: true, session }
    );

    if (slot.remainingCapacity > 0) {
      slot.status = "AVAILABLE";
      await slot.save({ session });
    }

    // 4. Promote from waitlist if possible
    const waitlist = await Waitlist.findOne({ slotId: slot._id }).session(session);

    let promotedBooking = null;
    let nextUser = null;

    if (waitlist && waitlist.users.length > 0) {
      // Find the first user whose quantity fits the available capacity
      // This prevents "head-of-line blocking" where a large request blocks smaller ones
      const userIndex = waitlist.users.findIndex(
        (u) => u.quantity <= slot.remainingCapacity
      );

      if (userIndex !== -1) {
        nextUser = waitlist.users[userIndex];

        // Deduct capacity again
        const updatedSlot = await Slot.findOneAndUpdate(
          { _id: slot._id, remainingCapacity: { $gte: nextUser.quantity } },
          { $inc: { remainingCapacity: -nextUser.quantity } },
          { new: true, session }
        );

        if (updatedSlot) {
          // Create Booking for promoted user
          const newBooking = await Booking.create([{
            userId: nextUser.userId,
            slotId: slot._id,
            quantity: nextUser.quantity,
            status: "CONFIRMED",
          }], { session });
          promotedBooking = newBooking[0];

          // Update Slot status
          if (updatedSlot.remainingCapacity === 0) {
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

    // Socket events (after commit)
    const io = req.app.get("io");
    if (promotedBooking && nextUser) {
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
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

const getMyBookings = catchAsync(async (req, res, next) => {
  const userId = req.user.userId;

  const bookings = await Booking.find({ userId })
    .populate({
      path: 'slotId',
      select: 'startTime endTime date eventId',
      populate: {
        path: 'eventId',
        select: 'title location'
      }
    })
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    results: bookings.length,
    bookings
  });
});

const getOrganizerBookings = catchAsync(async (req, res, next) => {
  const organizerId = req.user.userId;

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
  cancelBooking,
  getMyBookings,
  getOrganizerBookings
};
