const express = require('express');
const { createEvent } = require('./event.controller');
const verifyToken = require('../../middlewares/verifyToken');
const checkRole = require('../../middlewares/checkRole');

const router = express.Router();

// Create a new event
router.post('/', verifyToken, checkRole(['ADMIN', 'ORGANIZER']), createEvent);

module.exports = router;

