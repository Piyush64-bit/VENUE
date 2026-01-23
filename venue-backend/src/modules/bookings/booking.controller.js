const Booking = require("./booking.model");
const Slot = require("../slots/slot.model");

const bookSlot = async (req, res) => {
  try {
    const { slotId } = req.body;
    const userId = req.user.userId;

    // 1. Atomically decrease capacity ONLY if slot is available
    const slot = await Slot.findOneAndUpdate(
      {
        _id: slotId,
        status: "AVAILABLE",
        remainingCapacity: { $gt: 0 },
      },
      {
        $inc: { remainingCapacity: -1 },
      },
      { new: true }
    );

    // 2. If no slot updated → booking not possible
    if (!slot) {
      return res.status(400).json({
        message: "Slot is full or unavailable",
      });
    }

    // 3. If capacity reached 0 → mark FULL
    if (slot.remainingCapacity === 0) {
      slot.status = "FULL";
      await slot.save();
    }

    // 4. Create booking
    const booking = await Booking.create({
      userId,
      slotId,
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

module.exports = { bookSlot };
