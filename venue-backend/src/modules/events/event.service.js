const Event = require("./event.model");
const Slot = require("../slots/slot.model");
const generateSlots = require("../../utils/generateSlots");
const APIFeatures = require("../../utils/APIFeatures");
const AppError = require("../../utils/AppError");

const createEvent = async (eventData, userId) => {
  const session = await Event.startSession();
  session.startTransaction();

  try {
    const {
      title,
      description,
      startDate,
      endDate,
      slotDuration,
      capacityPerSlot,
    } = eventData;

    // 1. Create event
    const event = await Event.create(
      [
        {
          title,
          description,
          startDate,
          endDate,
          organizerId: userId,
        },
      ],
      { session }
    );

    // 2. Generate slots
    const slots = generateSlots(
      startDate,
      endDate,
      slotDuration,
      capacityPerSlot
    );

    // 3. Attach eventId
    // event is an array when using create with session
    const slotsWithEvent = slots.map((slot) => ({
      ...slot,
      eventId: event[0]._id,
    }));

    // 4. Save slots
    const createdSlots = await Slot.insertMany(slotsWithEvent, { session });

    await session.commitTransaction();
    return { event: event[0], slots: createdSlots };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const getEvents = async (queryString) => {
  const features = new APIFeatures(Event.find(), queryString)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const events = await features.query;
  const count = await Event.countDocuments(features.query.getFilter());

  return { events, count };
};

const getEventById = async (id) => {
  const event = await Event.findById(id);
  if (!event) {
    throw new AppError('Event not found', 404);
  }
  return event;
};

const getEventSlots = async (eventId, activeOnly = false) => {
  let query = {
    parentId: eventId,
    parentType: 'Event'
  };

  if (activeOnly) {
    query = {
      ...query,
      availableSeats: { $gt: 0 },
      // Optional: Filter out past slots
      // startTime: { $gte: new Date() } // Depends on date/time format stored
    };
  }

  const slots = await Slot.find(query).sort({ date: 1, startTime: 1 });
  return slots;
};

const getEventsByOrganizer = async (organizerId) => {
  const events = await Event.find({ organizerId }).sort({ createdAt: -1 });
  return events;
};

module.exports = {
  createEvent,
  getEvents,
  getEventById,
  getEventSlots,
  getEventsByOrganizer
};
