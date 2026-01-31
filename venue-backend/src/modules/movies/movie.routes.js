const express = require('express');
const { createMovie, getMovies } = require('./movie.controller');
const verifyToken = require('../../middlewares/verifyToken');
const checkRole = require('../../middlewares/checkRole');

const router = express.Router();

// Get all movies (Public)
router.get('/', getMovies);

// Create a new movie (Admin/Organizer only)
router.post('/', verifyToken, checkRole(['ADMIN', 'ORGANIZER']), createMovie);

module.exports = router;
