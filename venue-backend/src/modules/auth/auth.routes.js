const express = require('express');
const { registerUser, loginUser } = require('./auth.controller');
const validateRequest = require('../../middlewares/validateRequest');
const { registerSchema, loginSchema } = require('./auth.validation');
const { authLimiter } = require('../../middlewares/rateLimiter');

const router = express.Router();

router.use(authLimiter); // Apply rate limit to all auth routes

router.post('/register', validateRequest(registerSchema), registerUser);
router.post('/login', validateRequest(loginSchema), loginUser);

module.exports = router;
