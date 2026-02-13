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

/**
 * @swagger
 * /organizer/stats:
 *   get:
 *     summary: Get organizer dashboard statistics
 *     tags: [Organizer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalEvents:
 *                       type: integer
 *                     totalMovies:
 *                       type: integer
 *                     totalTicketsSold:
 *                       type: integer
 *                     totalRevenue:
 *                       type: number
 *                     popularContent:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           title:
 *                             type: string
 *                           type:
 *                             type: string
 *                           tickets:
 *                             type: integer
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/stats', organizerController.getOrganizerStats);

// Profile & Settings
/**
 * @swagger
 * /organizer/profile:
 *   get:
 *     summary: Get organizer profile
 *     tags: [Organizer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Organizer profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse_User'
 *   patch:
 *     summary: Update organizer profile
 *     tags: [Organizer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserProfileInput'
 *     responses:
 *       200:
 *         description: Profile updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse_User'
 */
router.get('/profile', organizerController.getProfile);
router.patch('/profile', organizerController.updateProfile);

/**
 * @swagger
 * /organizer/password:
 *   patch:
 *     summary: Change organizer password
 *     tags: [Organizer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PasswordChangeInput'
 *     responses:
 *       200:
 *         description: Password updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.patch('/password', organizerController.changePassword);

/**
 * @swagger
 * /organizer/upload:
 *   post:
 *     summary: Upload an image (for events/movies)
 *     tags: [Organizer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         imageUrl:
 *                           type: string
 */
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse_Event'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   get:
 *     summary: Get all events created by the logged-in organizer
 *     tags: [Organizer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of events
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse_Array_Event'
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse_Event'
 *       404:
 *         description: Event not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   patch:
 *     summary: Update an event
 *     tags: [Organizer]
 *     security:
 *       - bearerAuth: []
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse_Event'
 *   delete:
 *     summary: Delete an event and its slots
 *     tags: [Organizer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse_Event'
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse_Movie'
 *   get:
 *     summary: Get all movies created by the logged-in organizer
 *     tags: [Organizer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of movies
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse_Array_Movie'
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse_Movie'
 *   patch:
 *     summary: Update a movie
 *     tags: [Organizer]
 *     security:
 *       - bearerAuth: []
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse_Movie'
 *   delete:
 *     summary: Delete a movie and its slots
 *     tags: [Organizer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Movie deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse_Movie'
 */

router.patch('/movies/:id/publish', organizerController.toggleMoviePublish);

/* ======================================================
   SLOTS
   ====================================================== */
// Generic slot management
/**
 * @swagger
 * /organizer/slots/{id}:
 *   delete:
 *     summary: Delete a slot
 *     tags: [Organizer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Slot deleted
 *   patch:
 *     summary: Update a slot
 *     tags: [Organizer]
 *     security:
 *       - bearerAuth: []
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
 *               startTime:
 *                 type: string
 *               endTime:
 *                 type: string
 *               capacity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Slot updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse_Slot'
 */
router.route('/slots/:id')
    .delete(organizerController.deleteSlot)
    .patch(organizerController.updateSlot);

// Context-aware slot creation/retrieval
/**
 * @swagger
 * /organizer/events/{eventId}/slots:
 *   post:
 *     summary: Add a slot to an event
 *     tags: [Organizer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
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
 *               endTime:
 *                 type: string
 *               capacity:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Slot created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse_Slot'
 *   get:
 *     summary: Get slots for an event (Organizer view)
 *     tags: [Organizer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of slots
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse_Array_Slot'
 */
router.route('/events/:eventId/slots')
    .post(validateRequest(createSlotSchema), organizerController.createSlot)
    .get(organizerController.getSlotsByParent);

/**
 * @swagger
 * /organizer/movies/{movieId}/slots:
 *   post:
 *     summary: Add a slot to a movie
 *     tags: [Organizer]
 *     security:
 *       - bearerAuth: []
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse_Slot'
 *   get:
 *     summary: Get slots for a movie (Organizer view)
 *     tags: [Organizer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: movieId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of slots
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse_Array_Slot'
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
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Slots auto-generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse_Array_Slot'
 *       400:
 *         description: All dates already have slots
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/events/:eventId/slots/auto-generate', organizerController.autoGenerateSlots);

/**
 * @swagger
 * /organizer/movies/{movieId}/slots/auto-generate:
 *   post:
 *     summary: Auto-generate slots for a movie (Demo feature)
 *     tags: [Organizer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: movieId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Slots auto-generated successfully (90 days)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse_Array_Slot'
 *       400:
 *         description: All dates already have slots
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/movies/:movieId/slots/auto-generate', organizerController.autoGenerateSlots);


module.exports = router;
