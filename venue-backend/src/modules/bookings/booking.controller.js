const Booking = require("./booking.model");
const Slot = require("../slots/slot.model");
const Waitlist = require("../waitlist/waitlist.model");

/**
 * BOOK SLOT (Quantity-based)
 */
const bookSlot = async (req, res) => {
  try {
    const { slotId, quantity = 1 } = req.body;
    const userId = req.user.userId;

    if (quantity < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    // 1. Prevent duplicate booking per user per slot
    const existingBooking = await Booking.findOne({
      userId,
      slotId,
      status: "CONFIRMED",
    });

    if (existingBooking) {
      return res.status(400).json({
        message: "You have already booked this slot",
      });
    }

    // 2. Atomic capacity check + decrement (ONLY remainingCapacity matters)
    const slot = await Slot.findOneAndUpdate(
      {
        _id: slotId,
        remainingCapacity: { $gte: quantity },
      },
      {
        $inc: { remainingCapacity: -quantity },
      },
      { new: true }
    );

    // 3. Slot full or insufficient capacity → waitlist
    if (!slot) {
      const alreadyWaitlisted = await Waitlist.findOne({
        slotId,
        "users.userId": userId,
      });

      if (!alreadyWaitlisted) {
        await Waitlist.findOneAndUpdate(
          { slotId },
          { $push: { users: { userId, quantity } } },
          { upsert: true }
        );
      }

      // 🔔 Socket event
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

    // 4. Recompute status (derived field)
    slot.status = slot.remainingCapacity === 0 ? "FULL" : "AVAILABLE";
    await slot.save();

    // 5. Create booking
    const booking = await Booking.create({
      userId,
      slotId,
      quantity,
      status: "CONFIRMED",
    });

    return res.status(201).json({
      message: "Booking confirmed",
      booking,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to book slot",
      error: error.message,
    });
  }
};

/**
 * CANCEL BOOKING + PROMOTE WAITLIST
 */
const cancelBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.userId;

    // 1. Find booking (ownership enforced)
    const booking = await Booking.findOne({
      _id: bookingId,
      userId,
      status: "CONFIRMED",
    });

    if (!booking) {
      return res.status(400).json({
        message: "Booking not found or already cancelled",
      });
    }

    // 2. Cancel booking
    booking.status = "CANCELLED";
    await booking.save();

    // 3. Restore capacity
    const slot = await Slot.findByIdAndUpdate(
      booking.slotId,
      { $inc: { remainingCapacity: booking.quantity } },
      { new: true }
    );

    // 4. Recompute status (derived field)
    slot.status = slot.remainingCapacity > 0 ? "AVAILABLE" : "FULL";
    await slot.save();

    // 5. Promote from waitlist if possible
    const waitlist = await Waitlist.findOne({ slotId: slot._id });

    if (waitlist && waitlist.users.length > 0) {
      const next = waitlist.users[0];

      const updatedSlot = await Slot.findOneAndUpdate(
        {
          _id: slot._id,
          remainingCapacity: { $gte: next.quantity },
        },
        {
          $inc: { remainingCapacity: -next.quantity },
        },
        { new: true }
      );

      if (updatedSlot) {
        const promotedBooking = await Booking.create({
          userId: next.userId,
          slotId: slot._id,
          quantity: next.quantity,
          status: "CONFIRMED",
        });

        // Recompute status again
        updatedSlot.status =
          updatedSlot.remainingCapacity === 0 ? "FULL" : "AVAILABLE";
        await updatedSlot.save();

        // Update waitlist
        waitlist.users.shift();
        waitlist.users.length === 0
          ? await Waitlist.deleteOne({ _id: waitlist._id })
          : await waitlist.save();

        // 🔔 Socket event
        const io = req.app.get("io");
        io.to(next.userId.toString()).emit("waitlist:promoted", {
          slotId: slot._id,
          bookingId: promotedBooking._id,
          quantity: next.quantity,
          message: "You have been promoted from the waitlist",
        });

        return res.status(200).json({
          message: "Booking cancelled. Waitlist user promoted.",
          cancelledBooking: booking,
          promotedBooking,
        });
      }
    }

    return res.status(200).json({
      message: "Booking cancelled successfully",
      cancelledBooking: booking,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to cancel booking",
      error: error.message,
    });
  }
};

module.exports = {
  bookSlot,
  cancelBooking,
};
