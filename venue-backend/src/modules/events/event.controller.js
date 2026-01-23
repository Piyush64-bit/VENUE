const Event = require("./event.model");
const Slot = require("../slots/slot.model");
const generateSlots = require("../../utils/generateSlots");

const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      startDate,
      endDate,
      slotDuration,
      capacityPerSlot,
    } = req.body;

    // 1. Create event
    const event = await Event.create({
      title,
      description,
      startDate,
      endDate,
      organizerId: req.user.userId,
    });

    // 2. Generate slots (plain JS objects)
    const slots = generateSlots(
      startDate,
      endDate,
      slotDuration,
      capacityPerSlot
    );

    // 3. Attach eventId to each slot
    const slotsWithEvent = slots.map((slot) => ({
      ...slot,
      eventId: event._id,
    }));

    // 4. Save slots to DB
    await Slot.insertMany(slotsWithEvent);

    // 5. Response
    return res.status(201).json({
      message: "Event and slots created successfully",
      event,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create event",
      error: error.message,
    });
  }
};

module.exports = { createEvent };
