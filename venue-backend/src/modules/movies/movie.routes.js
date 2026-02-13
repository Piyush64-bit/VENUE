const express = require('express');
const { createMovie, getMovies, getMovieById, getMovieSlots } = require('./movie.controller');
const verifyToken = require('../../middlewares/verifyToken');
const checkRole = require('../../middlewares/checkRole');

const router = express.Router();
const cacheMiddleware = require('../../middlewares/cache.middleware');

// Get all movies (Public)
/**
 * @swagger
 * tags:
 *   name: Movies
 *   description: Movie management
 */

// Get all movies (Public)
/**
 * @swagger
 * /movies:
 *   get:
 *     summary: Get all movies
 *     tags: [Movies]
 *     responses:
 *       200:
 *         description: List of movies
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse_Array_Movie'
 */
// Cache for 60 seconds
router.get('/', cacheMiddleware(60), getMovies);

// Create a new movie (Admin/Organizer only)
/**
 * @swagger
 * /movies:
 *   post:
 *     summary: Create a new movie
 *     tags: [Movies]
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
 *               - releaseDate
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               releaseDate:
 *                 type: string
 *                 format: date
 *               duration:
 *                 type: integer
 *               genre:
 *                 type: array
 *                 items:
 *                   type: string
 *               poster:
 *                 type: string
 *     responses:
 *       201:
 *         description: Movie created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse_Movie'
 *       400:
 *         description: Validation Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', verifyToken, checkRole(['ADMIN', 'ORGANIZER']), createMovie);

// Get single movie
/**
 * @swagger
 * /movies/{id}:
 *   get:
 *     summary: Get a single published movie by ID
 *     tags: [Movies]
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
 *       404:
 *         description: Movie not found or not published
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// Cache for 60 seconds
router.get('/:id', cacheMiddleware(60), getMovieById);

// Get movie slots
/**
 * @swagger
 * /movies/{id}/slots:
 *   get:
 *     summary: Get active slots for a specific movie
 *     tags: [Movies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of active slots with available seats
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse_Array_Slot'
 *       404:
 *         description: Movie not found or not published
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id/slots', getMovieSlots);

module.exports = router;
