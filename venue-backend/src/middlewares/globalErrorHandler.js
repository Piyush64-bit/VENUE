const logger = require('../config/logger');

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    const errorLog = {
        message: err.message,
        statusCode: err.statusCode,
        method: req.method,
        path: req.originalUrl,
        requestId: req.id,
        stack: err.stack,
    };

    // Log all errors via Winston
    if (err.statusCode >= 500 || !err.isOperational) {
        logger.error(err.message, errorLog);
    } else {
        logger.warn(err.message, errorLog);
    }

    if (process.env.NODE_ENV === 'development') {
        res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack,
            requestId: req.id,
        });
    } else {
        // Production: Handle specific error types

        // MongoDB CastError (Invalid ObjectId)
        if (err.name === 'CastError') {
            return res.status(400).json({
                status: 'fail',
                message: `Invalid ${err.path}: ${err.value}`,
                requestId: req.id,
            });
        }

        // MongoDB Validation Error
        if (err.name === 'ValidationError') {
            const errors = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({
                status: 'fail',
                message: 'Validation failed',
                errors,
                requestId: req.id,
            });
        }

        // MongoDB Duplicate Key Error
        if (err.code === 11000) {
            const field = Object.keys(err.keyValue)[0];
            return res.status(400).json({
                status: 'fail',
                message: `${field} already exists`,
                requestId: req.id,
            });
        }

        // JWT Errors
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({
                status: 'fail',
                message: 'Invalid token. Please log in again.',
                requestId: req.id,
            });
        }

        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                status: 'fail',
                message: 'Your token has expired. Please log in again.',
                requestId: req.id,
            });
        }

        // Operational errors (trusted errors)
        if (err.isOperational) {
            res.status(err.statusCode).json({
                status: err.status,
                message: err.message,
                requestId: req.id,
            });
        } else {
            // Programming or unknown errors - don't leak details
            res.status(500).json({
                status: 'error',
                message: 'Something went wrong!',
                requestId: req.id,
            });
        }
    }
};
