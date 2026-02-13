const redisService = require('../services/redis.service');
const logger = require('../config/logger') || console;

/**
 * Middleware to cache GET responses using Redis
 * @param {number} duration - Cache duration in seconds
 */
const cacheMiddleware = (duration = 60) => {
    return async (req, res, next) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        const redisClient = redisService.getClient();

        // Fail open if Redis is not available
        if (!redisClient || !redisService.isConnected) {
            return next();
        }

        const key = `cache:${req.originalUrl}`;

        try {
            const cachedResponse = await redisClient.get(key);
            if (cachedResponse) {
                logger.debug(`Cache HIT for ${req.originalUrl}`);
                // Return cached response
                // Parse it to ensure it's valid JSON, then send
                // This preserves the Content-Type: application/json header logic of res.json
                return res.status(200).json(JSON.parse(cachedResponse));
            }
            logger.debug(`Cache MISS for ${req.originalUrl}`);
        } catch (err) {
            logger.error('Redis cache read error:', err);
            // Fail open on read error
            return next();
        }

        // Hijack res.send to cache the response body
        const originalSend = res.send;
        res.send = function (body) {
            // Only cache successful 200 OK responses
            if (res.statusCode === 200) {
                try {
                    // Ensure we stick to the plan: don't cache 401/403/404 (handled by statusCode check)
                    // and don't cache errors (usually status 4xx/5xx)

                    // The body might be an object (if res.json called) or string (if res.send called directly)
                    // If it's an object, JSON.stringify was already done or will be done by express.
                    // But res.send argument can be object.

                    const responseBody = typeof body === 'string' ? body : JSON.stringify(body);

                    redisClient.set(key, responseBody, 'EX', duration).catch(err => {
                        logger.error('Redis cache write error:', err);
                    });
                } catch (err) {
                    logger.error('Redis cache serialization error:', err);
                }
            }

            return originalSend.call(this, body);
        };

        next();
    };
};

module.exports = cacheMiddleware;
