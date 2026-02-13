const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const redisService = require('../services/redis.service');
const AppError = require('../utils/AppError');

const redisClient = redisService.getClient();

const createLimiter = (options) => {
    // 1. Extract custom options that shouldn't be passed to rateLimit
    const { prefix, useUserId, ...rateLimitOptions } = options;

    const limiterConfig = {
        standardHeaders: true,
        legacyHeaders: false,
        passOnStoreError: true, // Fail-open if Redis is unavailable
        // Use custom key generator only if useUserId is true
        keyGenerator: useUserId ? (req) => {
            if (req.user && req.user.id) {
                return req.user.id;
            }
            // For IPv6 safety, use the helper when falling back to IP in a custom generator
            return rateLimit.ipKeyGenerator(req);
        } : undefined, // Default to express-rate-limit's built-in generator
        handler: (req, res, next, options) => {
            // Standardized error response
            next(new AppError(options.message.message || 'Too many requests', 429));
        },
        ...rateLimitOptions,
    };

    // 2. Configure Redis Store if client exists
    if (redisClient) {
        limiterConfig.store = new RedisStore({
            sendCommand: (...args) => redisClient.call(...args),
            prefix: `rl:${prefix || 'global'}:`, // Namespace prefixes
        });
    }

    // 3. Create the limiter
    return rateLimit(limiterConfig);
};

// ==========================================
// TIER 1: GLOBAL API SHIELD
// ==========================================
const globalLimiter = createLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: 1000,
    prefix: 'global',
    message: { message: 'Too many requests from this IP, please try again after an hour' },
});

// ==========================================
// TIER 2: AUTH BRUTE FORCE PROTECTION
// ==========================================
const authLimiter = createLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 10,
    prefix: 'auth',
    message: { message: 'Too many login attempts, please try again after 15 minutes' },
});

// ==========================================
// TIER 3: PUBLIC READ SCRAPE PROTECTION
// ==========================================
// Applies to GET requests on public data
const publicReadLimiter = createLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: 3000,
    prefix: 'public_read',
    message: { message: 'Too many public data requests, please try again later' },
    skip: (req) => req.method !== 'GET', // Only limit GET requests
});

// ==========================================
// TIER 4: PER-USER DYNAMIC LIMIT
// ==========================================
// General limit for authenticated users
const userLimiter = createLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: 200,
    prefix: 'user',
    useUserId: true, // Custom flag to use req.user.id
    message: { message: 'You have exceeded your request limit for this hour' },
});

// ==========================================
// TIER 5: WRITE OPERATION THROTTLE
// ==========================================
// Limits mutations (POST, PUT, PATCH, DELETE)
const writeLimiter = createLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: 100,
    prefix: 'write',
    useUserId: true,
    message: { message: 'Write limit exceeded, please slow down' },
    skip: (req) => req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS',
});

// ==========================================
// TIER 6: BOOKING BURST GUARD
// ==========================================
// Specific protection for booking endpoints
const bookingLimiter = createLimiter({
    windowMs: 60 * 1000, // 1 minute
    limit: 5,
    prefix: 'booking',
    useUserId: true,
    message: { message: 'Too many booking attempts, please wait a minute' },
});

module.exports = {
    globalLimiter,
    authLimiter,
    publicReadLimiter,
    userLimiter,
    writeLimiter,
    bookingLimiter
};
