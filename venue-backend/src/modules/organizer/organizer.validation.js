const { z } = require('zod');

const createEventSchema = z.object({
    body: z.object({
        title: z.string().min(3, 'Title must be at least 3 characters'),
        description: z.string().optional(),
        startDate: z.coerce.date({ message: 'Invalid start date format' }),
        endDate: z.coerce.date({ message: 'Invalid end date format' }),
        location: z.string().min(1, 'Location is required'),
        price: z.number().min(0).optional(),
        category: z.string().optional(),
        image: z.string().url().optional()
    }).refine((data) => new Date(data.startDate) < new Date(data.endDate), {
        message: 'End date must be after start date',
        path: ['endDate']
    })
});

const updateEventSchema = z.object({
    body: z.object({
        title: z.string().min(3).optional(),
        description: z.string().optional(),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
        location: z.string().optional(),
        price: z.number().min(0).optional(),
        category: z.string().optional(),
        image: z.string().url().optional(),
        isPublished: z.boolean().optional()
    })
});

const createMovieSchema = z.object({
    body: z.object({
        title: z.string().min(1, 'Title is required'),
        description: z.string().min(1, 'Description is required'),
        poster: z.string().url({ message: 'Invalid poster URL' }).optional(),
        genre: z.string().optional(),
        runtime: z.string().min(1, 'Runtime is required (e.g. "2h 30m")'),
        releaseDate: z.coerce.date({ message: 'Invalid release date format' }),
        rating: z.number().min(0).max(10).optional()
    })
});

const updateMovieSchema = z.object({
    body: z.object({
        title: z.string().min(1).optional(),
        description: z.string().min(1).optional(),
        poster: z.string().url().optional(),
        image: z.string().url().optional(), // Allow 'image' as alias for poster
        genre: z.string().optional(),
        runtime: z.string().optional(),
        releaseDate: z.coerce.date().optional(),
        rating: z.number().min(0).max(10).optional(),
        price: z.number().min(0).optional(),
        status: z.enum(['NOW_SHOWING', 'COMING_SOON']).optional(),
        isPublished: z.boolean().optional()
    })
});

const createSlotSchema = z.object({
    body: z.object({
        parentType: z.enum(['Event', 'Movie']).optional(), // Optional, can be in params
        parentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid parent ID').optional(),
        date: z.coerce.date({ message: 'Invalid date format' }),
        startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
        endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
        capacity: z.coerce.number().int().min(1, 'Capacity must be at least 1')
    }).refine((data) => {
        // Simple string comparison for HH:MM works if same length
        return data.endTime > data.startTime;
    }, {
        message: 'End time must be after start time',
        path: ['endTime']
    })
});

module.exports = {
    createEventSchema,
    updateEventSchema,
    createMovieSchema,
    updateMovieSchema,
    createSlotSchema
};
