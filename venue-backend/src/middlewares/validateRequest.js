const { ZodError } = require('zod');
const AppError = require('../utils/AppError');

const validateRequest = (schema) => async (req, res, next) => {
    try {
        // Use safeParse to handle validation errors without throwing
        const result = await schema.safeParseAsync({
            body: req.body,
            query: req.query,
            params: req.params,
        });

        if (!result.success) {
            const error = result.error;

            // Handle Zod validation errors properly
            let errorMessages = 'Validation failed';
            if (error.errors && Array.isArray(error.errors)) {
                errorMessages = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join('. ');
            } else if (error.message) {
                errorMessages = error.message;
            }

            return next(new AppError(errorMessages, 400));
        }
        next(); // Proceed to the next middleware if validation is successful
    } catch (error) {
        // This catch block will now primarily handle non-Zod errors from schema.safeParseAsync
        // or other unexpected errors during the validation process itself.
        next(error);
    }
};

module.exports = validateRequest;
