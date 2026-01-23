const express = require('express');
const { bookSlot } = require('./booking.controller');
const verifyToken = require('../../middlewares/verifyToken');
const checkRole = require('../../middlewares/checkRole');

const router = express.Router();

// Book a slot
router.post('/', verifyToken, checkRole(['USER']), bookSlot);

module.exports = router;

