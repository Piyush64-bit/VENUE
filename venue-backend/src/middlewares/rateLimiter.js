const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 'fail',
        message: 'Too many login attempts from this IP, please try again after 15 minutes',
    },
});

const apiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 1000, // Limit each IP to 1000 requests per hour
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 'fail',
        message: 'Too many requests from this IP, please try again after an hour',
    },
});

const publicLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3000, // Limit each IP to 3000 requests per hour
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 'fail',
        message: 'Too many requests from this IP, please try again after an hour',
    },
});

module.exports = { authLimiter, apiLimiter, publicLimiter };
