const { ZodError } = require('zod');
const AppError = require('../utils/AppError');

const validateRequest = (schema) => async (req, res, next) => {
    try {
        // Validate request body
        await schema.parseAsync(req.body);
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            // Format Zod errors
            const errorMessages = error.errors.map((err) => err.message).join('. ');
            return next(new AppError(errorMessages, 400));
        }
        next(error);
    }
};

module.exports = validateRequest;
