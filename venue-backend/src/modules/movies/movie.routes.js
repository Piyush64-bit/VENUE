const express = require('express');
const { createMovie, getMovies } = require('./movie.controller');
const verifyToken = require('../../middlewares/verifyToken');
const checkRole = require('../../middlewares/checkRole');

const router = express.Router();

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
 */
router.get('/', getMovies);

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
 *       403:
 *         description: Forbidden
 */
router.post('/', verifyToken, checkRole(['ADMIN', 'ORGANIZER']), createMovie);

module.exports = router;
