module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Log errors only in development or for non-operational errors
    if (process.env.NODE_ENV === 'development' || !err.isOperational) {
        console.error('------- GLOBAL ERROR HANDLER -------');
        console.error(err);
        console.error('------------------------------------');
    }

    if (process.env.NODE_ENV === 'development') {
        res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack,
        });
    } else {
        // Production: Handle specific error types

        // MongoDB CastError (Invalid ObjectId)
        if (err.name === 'CastError') {
            return res.status(400).json({
                status: 'fail',
                message: `Invalid ${err.path}: ${err.value}`
            });
        }

        // MongoDB Validation Error
        if (err.name === 'ValidationError') {
            const errors = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({
                status: 'fail',
                message: 'Validation failed',
                errors
            });
        }

        // MongoDB Duplicate Key Error
        if (err.code === 11000) {
            const field = Object.keys(err.keyValue)[0];
            return res.status(400).json({
                status: 'fail',
                message: `${field} already exists`
            });
        }

        // JWT Errors
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({
                status: 'fail',
                message: 'Invalid token. Please log in again.'
            });
        }

        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                status: 'fail',
                message: 'Your token has expired. Please log in again.'
            });
        }

        // Operational errors (trusted errors)
        if (err.isOperational) {
            res.status(err.statusCode).json({
                status: err.status,
                message: err.message,
            });
        } else {
            // Programming or unknown errors - don't leak details
            console.error('ERROR 💥', err);
            res.status(500).json({
                status: 'error',
                message: 'Something went wrong!',
            });
        }
    }
};
