module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Always log the full error for debugging purposes right now
    console.error('------- GLOBAL ERROR HANDLER -------');
    console.error(err);
    console.error('------------------------------------');

    if (process.env.NODE_ENV === 'development') {
        res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack,
        });
    } else {
        // Production: Don't leak stack traces
        if (err.isOperational) {
            res.status(err.statusCode).json({
                status: err.status,
                message: err.message,
            });
        } else {
            // 1) Log error
            console.error('ERROR 💥', err);

            // 2) Send generic message
            res.status(500).json({
                status: 'error',
                message: 'Something went wrong!',
            });
        }
    }
};
