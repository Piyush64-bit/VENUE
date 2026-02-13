const Redis = require("ioredis");
const logger = require("../config/logger");

class RedisService {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.initialize();
    }

    initialize() {
        const redisUrl = process.env.REDIS_URL;

        if (!redisUrl) {
            logger.warn("REDIS_URL not found in environment variables. Redis features will be disabled.");
            return;
        }

        this.client = new Redis(redisUrl, {
            maxRetriesPerRequest: 3,
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
            reconnectOnError: (err) => {
                const targetError = "READONLY";
                if (err.message.includes(targetError)) {
                    // Only reconnect when the error starts with "READONLY"
                    return true;
                }
                return false;
            },
        });

        this.client.on("connect", () => {
            this.isConnected = true;
            logger.info("Redis connected successfully");
        });

        this.client.on("error", (err) => {
            this.isConnected = false;
            logger.error("Redis connection error:", err);
        });

        this.client.on("close", () => {
            this.isConnected = false;
            logger.warn("Redis connection closed");
        });
    }

    getClient() {
        return this.client;
    }

    async clearCache(pattern) {
        if (!this.isConnected || !this.client) return;

        try {
            let cursor = '0';
            do {
                const reply = await this.client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
                cursor = reply[0];
                const keys = reply[1];

                if (keys.length > 0) {
                    const pipeline = this.client.pipeline();
                    keys.forEach((key) => pipeline.del(key));
                    await pipeline.exec();
                }
            } while (cursor !== '0');

            logger.info(`Cache cleared for pattern: ${pattern}`);
        } catch (err) {
            logger.error('Redis clear cache error:', err);
        }
    }

    async disconnect() {
        if (this.client) {
            await this.client.quit();
            this.isConnected = false;
            logger.info("Redis disconnected gracefully");
        }
    }
}

// Export a singleton instance
const redisService = new RedisService();
module.exports = redisService;
