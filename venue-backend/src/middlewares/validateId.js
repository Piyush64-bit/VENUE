const mongoose = require('mongoose');
const AppError = require('../utils/AppError');

/**
 * Middleware to validate MongoDB ObjectId parameters.
 * @param {...string} paramNames - The name(s) of the parameters to validate (e.g., 'id', 'userId'). 
 * Defaults to 'id' if no arguments are provided.
 * 
 * Usage:
 * - router.get('/:id', validateId('id'), controller)
 * - router.get('/:userId/:eventId', validateId('userId', 'eventId'), controller)
 */
const validateId = (...paramNames) => {
    return (req, res, next) => {
        // Default to 'id' if no params specified
        const params = paramNames.length > 0 ? paramNames : ['id'];

        for (const param of params) {
            const value = req.params[param];
            if (value && !mongoose.Types.ObjectId.isValid(value)) {
                return next(new AppError(`Invalid ${param}: ${value}`, 400));
            }
        }
        next();
    };
};

module.exports = validateId;
