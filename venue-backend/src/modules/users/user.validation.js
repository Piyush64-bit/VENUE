const { z } = require('zod');

const updateProfileSchema = z.object({
    body: z.object({
        name: z.string().min(3, 'Name must be at least 3 characters').optional(),
        email: z.string().email('Invalid email address').optional(),
    })
});

module.exports = {
    updateProfileSchema,
};
