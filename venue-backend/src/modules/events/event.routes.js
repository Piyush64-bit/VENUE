const express = require('express');
const { createEvent, getEvents, getEventById, getEventSlots, getOrganizerEvents } = require('./event.controller');
const verifyToken = require('../../middlewares/verifyToken');
const checkRole = require('../../middlewares/checkRole');

const router = express.Router();

// Get all events
router.get('/', getEvents);

// Get single event
router.get('/:id', getEventById);

// Get slots for an event
// Get slots for an event
router.get('/:id/slots', getEventSlots);

// Get organizer's own events
router.get('/organizer', verifyToken, checkRole(['ADMIN', 'ORGANIZER']), getOrganizerEvents);


// Create a new event
router.post('/', verifyToken, checkRole(['ADMIN', 'ORGANIZER']), createEvent);

module.exports = router;

