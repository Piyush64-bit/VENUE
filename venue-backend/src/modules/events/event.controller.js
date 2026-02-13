const eventService = require('./event.service');
const catchAsync = require('../../utils/catchAsync');
const ApiResponse = require('../../utils/ApiResponse');
const redisService = require('../../services/redis.service');

const createEvent = catchAsync(async (req, res, next) => {
  const { event, slots } = await eventService.createEvent(req.body, req.user.userId);
  await redisService.clearCache('events:*');

  return res.status(201).json(
    new ApiResponse(201, { event, slots }, "Event and slots created successfully")
  );
});

const getEvents = catchAsync(async (req, res, next) => {
  // Force isPublished=true for public listing
  const query = { ...req.query, isPublished: true };
  const { events, count } = await eventService.getEvents(query);

  return res.status(200).json(
    new ApiResponse(200, { results: count, events }, "Events fetched successfully")
  );
});

const getEventById = catchAsync(async (req, res, next) => {
  const event = await eventService.getEventById(req.params.id);

  // Public access: must be published
  if (!event.isPublished) {
    const AppError = require('../../utils/AppError');
    throw new AppError('Event not found or not published', 404);
  }

  return res.status(200).json(
    new ApiResponse(200, { event }, "Event fetched successfully")
  );
});

const getEventSlots = catchAsync(async (req, res, next) => {
  // 1. Check if event exists and is published
  const event = await eventService.getEventById(req.params.id);

  if (!event || !event.isPublished) {
    const AppError = require('../../utils/AppError');
    throw new AppError('Event not found or not published', 404);
  }

  // 2. Fetch slots with filters (Active & Capacity)
  const slots = await eventService.getEventSlots(req.params.id, true); // true = activeOnly
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
