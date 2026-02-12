const express = require('express');
const router = express.Router();
const organizerController = require('./organizer.controller');
const verifyToken = require('../../middlewares/verifyToken');
const checkRole = require('../../middlewares/checkRole');
const validateRequest = require('../../middlewares/validateRequest');
const {
    createEventSchema,
    updateEventSchema,
    createMovieSchema,
    updateMovieSchema,
    createSlotSchema
} = require('./organizer.validation');
const { upload } = require('../../middlewares/upload.middleware');

// Protect all routes
router.use(verifyToken);
router.use(checkRole(['ORGANIZER']));

router.get('/stats', organizerController.getOrganizerStats);

// Profile & Settings
router.get('/profile', organizerController.getProfile);
router.patch('/profile', organizerController.updateProfile);
router.patch('/password', organizerController.changePassword);
router.post('/upload', upload.single('image'), organizerController.uploadImage);

/* ======================================================
   EVENTS
   ====================================================== */

/**
 * @swagger
 * /organizer/events:
 *   post:
 *     summary: Create a new event
 *     tags: [Organizer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - startDate
 *               - endDate
 *               - location
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: string
 *               price:
 *                 type: number
 *               category:
 *                 type: string
 *               image:
 *                 type: string
 *     responses:
 *       201:
 *         description: Event created
 *       400:
 *         description: Validation error
 *   get:
 *     summary: Get all events created by the logged-in organizer
 *     tags: [Organizer]
 *     responses:
 *       200:
 *         description: List of events
 */
router.route('/events')
    .post(validateRequest(createEventSchema), organizerController.createEvent)
    .get(organizerController.getMyEvents);

/**
 * @swagger
 * /organizer/events/{id}:
 *   get:
 *     summary: Get specific event details
 *     tags: [Organizer]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event details
 *       404:
 *         description: Event not found
 *   patch:
 *     summary: Update an event
 *     tags: [Organizer]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Event updated
 *   delete:
 *     summary: Delete an event and its slots
 *     tags: [Organizer]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event deleted
 */
/**
 * @swagger
 * /organizer/events/{id}:
 *   get:
 *     summary: Get specific event details
 *     tags: [Organizer]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event details
 *       404:
 *         description: Event not found
 *   patch:
 *     summary: Update an event
 *     tags: [Organizer]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Event updated
 *   delete:
 *     summary: Delete an event and its slots
 *     tags: [Organizer]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event deleted
 */
router.route('/events/:id')
    .get(organizerController.getEventById)
    .patch(validateRequest(updateEventSchema), organizerController.updateEvent)
    .delete(organizerController.deleteEvent);

/**
 * @swagger
 * /organizer/events/{id}/publish:
 *   patch:
 *     summary: Publish or unpublish an event
 *     tags: [Organizer]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - publish
 *             properties:
 *               publish:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Event status updated
 */
/**
 * @swagger
 * /organizer/events/{id}/publish:
 *   patch:
 *     summary: Publish or unpublish an event
 *     tags: [Organizer]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - publish
 *             properties:
 *               publish:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Event status updated
 */
router.patch('/events/:id/publish', organizerController.toggleEventPublish);

/* ======================================================
   MOVIES
   ====================================================== */

/**
 * @swagger
 * /organizer/movies:
 *   post:
 *     summary: Create a new movie
 *     tags: [Organizer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - releaseDate
 *               - runtime
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               releaseDate:
 *                 type: string
 *                 format: date-time
 *               runtime:
 *                 type: string
 *               genre:
 *                 type: string
 *               poster:
 *                 type: string
 *     responses:
 *       201:
 *         description: Movie created
 *   get:
 *     summary: Get all movies created by the logged-in organizer
 *     tags: [Organizer]
 *     responses:
 *       200:
 *         description: List of movies
 */
router.route('/movies')
    .post(validateRequest(createMovieSchema), organizerController.createMovie)
    .get(organizerController.getMyMovies);

/**
 * @swagger
 * /organizer/movies/{id}:
 *   get:
 *     summary: Get specific movie details
 *     tags: [Organizer]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Movie details
 *   patch:
 *     summary: Update a movie
 *     tags: [Organizer]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *     responses:
 *       200:
 *         description: Movie updated
 *   delete:
 *     summary: Delete a movie and its slots
 *     tags: [Organizer]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Movie deleted
 */
/**
 * @swagger
 * /organizer/movies/{id}:
 *   get:
 *     summary: Get specific movie details
 *     tags: [Organizer]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Movie details
 *   patch:
 *     summary: Update a movie
 *     tags: [Organizer]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *     responses:
 *       200:
 *         description: Movie updated
 *   delete:
 *     summary: Delete a movie and its slots
 *     tags: [Organizer]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Movie deleted
 */
router.route('/movies/:id')
    .get(organizerController.getMovieById)
    .patch(validateRequest(updateMovieSchema), organizerController.updateMovie)
    .delete(organizerController.deleteMovie);

/**
 * @swagger
 * /organizer/movies/{id}/publish:
 *   patch:
 *     summary: Publish or unpublish a movie
 *     tags: [Organizer]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - publish
 *             properties:
 *               publish:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Movie status updated
 */
/**
 * @swagger
 * /organizer/movies/{id}/publish:
 *   patch:
 *     summary: Publish or unpublish a movie
 *     tags: [Organizer]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - publish
 *             properties:
 *               publish:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Movie status updated
 */
router.patch('/movies/:id/publish', organizerController.toggleMoviePublish);

/* ======================================================
   SLOTS
   ====================================================== */
// Generic slot management
router.route('/slots/:id')
    .delete(organizerController.deleteSlot)
    .patch(organizerController.updateSlot);

// Context-aware slot creation/retrieval
router.route('/events/:eventId/slots')
    .post(validateRequest(createSlotSchema), organizerController.createSlot)
    .get(organizerController.getSlotsByParent);

/**
 * @swagger
 * /organizer/movies/{movieId}/slots:
 *   post:
 *     summary: Add a slot to a movie
 *     tags: [Organizer]
 *     parameters:
 *       - in: path
 *         name: movieId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - startTime
 *               - endTime
 *               - capacity
 *             properties:
 *               date:
 *                 type: string
 *                 format: date-time
 *               startTime:
 *                 type: string
 *                 example: "10:00"
 *               endTime:
 *                 type: string
 *                 example: "12:00"
 *               capacity:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Slot created
 *   get:
 *     summary: Get slots for a movie (Organizer view)
 *     tags: [Organizer]
 *     parameters:
 *       - in: path
 *         name: movieId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of slots
 */
router.route('/movies/:movieId/slots')
    .post(validateRequest(createSlotSchema), organizerController.createSlot)
    .get(organizerController.getSlotsByParent);

/* ======================================================
   AUTO SLOT GENERATION (DEMO/PORTFOLIO)
   ====================================================== */

/**
 * @swagger
 * /organizer/events/{eventId}/slots/auto-generate:
 *   post:
 *     summary: Auto-generate slots for an event (Demo feature)
 *     tags: [Organizer]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Slots auto-generated successfully
 *       400:
 *         description: All dates already have slots
 */
router.post('/events/:eventId/slots/auto-generate', organizerController.autoGenerateSlots);

/**
 * @swagger
 * /organizer/movies/{movieId}/slots/auto-generate:
 *   post:
 *     summary: Auto-generate slots for a movie (Demo feature)
 *     tags: [Organizer]
 *     parameters:
 *       - in: path
 *         name: movieId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Slots auto-generated successfully (90 days)
 *       400:
 *         description: All dates already have slots
 */
router.post('/movies/:movieId/slots/auto-generate', organizerController.autoGenerateSlots);


module.exports = router;
