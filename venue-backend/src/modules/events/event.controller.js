const eventService = require('./event.service');
const catchAsync = require('../../utils/catchAsync');
const ApiResponse = require('../../utils/ApiResponse');

const createEvent = catchAsync(async (req, res, next) => {
  const { event, slots } = await eventService.createEvent(req.body, req.user.userId);

  return res.status(201).json(
    new ApiResponse(201, { event, slots }, "Event and slots created successfully")
  );
});

const getEvents = catchAsync(async (req, res, next) => {
  const { events, count } = await eventService.getEvents(req.query);

  return res.status(200).json(
    new ApiResponse(200, { results: count, events }, "Events fetched successfully")
  );
});

const getEventById = catchAsync(async (req, res, next) => {
  const event = await eventService.getEventById(req.params.id);
  return res.status(200).json(
    new ApiResponse(200, { event }, "Event fetched successfully")
  );
});

const getEventSlots = catchAsync(async (req, res, next) => {
  const slots = await eventService.getEventSlots(req.params.id);
  return res.status(200).json(
    new ApiResponse(200, { slots }, "Slots fetched successfully")
  );
});

const getOrganizerEvents = catchAsync(async (req, res, next) => {
  const events = await eventService.getEventsByOrganizer(req.user.userId);
  return res.status(200).json(
    new ApiResponse(200, { results: events.length, events }, "Organizer events fetched successfully")
  );
});

module.exports = { createEvent, getEvents, getEventById, getEventSlots, getOrganizerEvents };
