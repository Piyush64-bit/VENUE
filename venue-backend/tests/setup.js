const mongoose = require('mongoose');
const redisService = require('../src/services/redis.service');
const logger = require('../src/config/logger');

// Load test environment variables
require('dotenv').config({ path: '.env.test' });

// Suppress console logs during tests (optional)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };

// Increase test timeout for integration tests
jest.setTimeout(30000);

// Connect to test database before all tests
beforeAll(async () => {
  try {
    // Ensure we're using test database
    if (!process.env.MONGO_URI || !process.env.MONGO_URI.includes('test')) {
      throw new Error('MONGO_URI must contain "test" in the database name for safety');
    }

    // Connect to MongoDB test database
    await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });

    logger.info('✓ Test database connected');

    // Try to connect to Redis (optional - tests can run without it)
    try {
      if (process.env.REDIS_URL && redisService.client) {
        // Redis connection is attempted in redis.service.js
        // Just wait a bit for it to potentially connect
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (redisService.client.status === 'ready') {
          logger.info('✓ Redis connected');
        }
      }
    } catch (redisError) {
      logger.warn('⚠️  Redis not available, continuing without it:', redisError.message);
      // Continue - many tests don't need Redis
    }
  } catch (error) {
    logger.error('Failed to connect to test database:', error);
    throw error;
  }
});

// Clear all collections before each test
beforeEach(async () => {
  try {
    const collections = mongoose.connection.collections;

    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  } catch (error) {
    logger.error('Error clearing database:', error);
    throw error;
  }
});

// Close database connection after all tests
afterAll(async () => {
  try {
    // Close mongoose connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      logger.info('✓ Test database connection closed');
    }

    // Close Redis connection if exists
    try {
      if (redisService.client && redisService.client.status === 'ready') {
        await redisService.client.quit();
        logger.info('✓ Redis connection closed');
      }
    } catch (redisError) {
      // Ignore Redis cleanup errors
      logger.debug('Redis cleanup skipped:', redisError.message);
    }

    // Give time for connections to close
    await new Promise(resolve => setTimeout(resolve, 500));
  } catch (error) {
    logger.error('Error closing connections:', error);
  }
});
