const express = require('express');
const { createEvent, getEvents, getEventById, getEventSlots, getOrganizerEvents } = require('./event.controller');
const verifyToken = require('../../middlewares/verifyToken');
const checkRole = require('../../middlewares/checkRole');

const router = express.Router();

// Get all events
/**
 * @swagger
 * tags:
 *   name: Events
 *   description: Event management
 */

// Get all events
/**
 * @swagger
 * /events:
 *   get:
 *     summary: Get all events
 *     tags: [Events]
 *     responses:
 *       200:
 *         description: List of events
 */
router.get('/', getEvents);

// Get organizer's own events
/**
 * @swagger
 * /events/organizer:
 *   get:
 *     summary: Get organizer's own events
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of organizer's events
 *       403:
 *         description: Forbidden
 */
router.get('/organizer', verifyToken, checkRole(['ADMIN', 'ORGANIZER']), getOrganizerEvents);


// Create a new event
/**
 * @swagger
 * /events:
 *   post:
 *     summary: Create a new event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - date
 *               - location
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: string
 *               category:
 *                 type: string
 *               price:
 *                 type: number
 *               image:
 *                 type: string
 *     responses:
 *       201:
 *         description: Event created successfully
 *       403:
 *         description: Forbidden
 */
router.post('/', verifyToken, checkRole(['ADMIN', 'ORGANIZER']), createEvent);

const validateId = require('../../middlewares/validateId');

// ... (existing code)

// Get single event
/**
 * @swagger
 * /events/{id}:
 *   get:
 *     summary: Get a single published event by ID
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event details
 *       404:
 *         description: Event not found or not published
 */
router.get('/:id', validateId('id'), getEventById);

// Get slots for an event
/**
 * @swagger
 * /events/{id}/slots:
 *   get:
 *     summary: Get active slots for a specific event
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: List of active slots with available seats
 *       404:
 *         description: Event not found or not published
 */
router.get('/:id/slots', validateId('id'), getEventSlots);

module.exports = router;

