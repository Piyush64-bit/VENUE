const jwt = require('jsonwebtoken');
const User = require('../src/modules/users/user.model');
const Event = require('../src/modules/events/event.model');

/**
 * Generate a valid JWT token for testing
 * @param {Object} payload - Token payload
 * @returns {String} JWT token
 */
const generateTestToken = (payload = {}) => {
  const defaultPayload = {
    userId: '507f1f77bcf86cd799439011',
    role: 'USER',
    ...payload,
  };

  return jwt.sign(defaultPayload, process.env.JWT_SECRET || 'test-secret', {
    expiresIn: '1h',
  });
};

/**
 * Create a test user in the database
 * @param {Object} userData - User data
 * @returns {Object} Created user
 */
const createTestUser = async (userData = {}) => {
  const defaultUser = {
    name: 'Test User',
    email: `test-${Date.now()}@example.com`,
    password: 'hashedPassword123!',
    role: 'USER',
    ...userData,
  };

  const user = await User.create(defaultUser);
  return user;
};

/**
 * Create a test organizer user
 * @param {Object} userData - User data
 * @returns {Object} Created organizer
 */
const createTestOrganizer = async (userData = {}) => {
  return createTestUser({ role: 'ORGANIZER', ...userData });
};

/**
 * Create a test admin user
 * @param {Object} userData - User data
 * @returns {Object} Created admin
 */
const createTestAdmin = async (userData = {}) => {
  return createTestUser({ role: 'ADMIN', ...userData });
};

/**
 * Create a test event
 * @param {String} organizerId - Organizer ID
 * @param {Object} eventData - Event data
 * @returns {Object} Created event
 */
const createTestEvent = async (organizerId, eventData = {}) => {
  const Event = require('../src/modules/events/event.model');
  
  const defaultEvent = {
    title: 'Test Event',
    description: 'Test event description',
    category: 'Music',
    location: 'Test Venue, Test City',
    organizerId: organizerId,
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // +3 hours
    price: 50,
    status: 'ACTIVE',
    isPublished: true,
    ...eventData,
  };

  const event = await Event.create(defaultEvent);
  return event;
};

/**
 * Create a test slot
 * @param {String} parentId - Parent (Event/Movie) ID
 * @param {String} parentType - Parent type ('Event' or 'Movie')
 * @param {Object} slotData - Slot data
 * @returns {Object} Created slot
 */
const createTestSlot = async (parentId, parentType = 'Event', slotData = {}) => {
  const Slot = require('../src/modules/slots/slot.model');
  
  const defaultSlot = {
    parentType: parentType,
    parentId: parentId,
    capacity: 100,
    availableSeats: 100,
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    startTime: '19:00',
    endTime: '22:00',
    status: 'AVAILABLE',
    ...slotData,
  };

  const slot = await Slot.create(defaultSlot);
  return slot;
};

/**
 * Mock Redis service (useful when Redis is not available in tests)
 */
const mockRedisService = () => {
  jest.mock('../src/services/redis.service', () => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    client: {
      status: 'ready',
      quit: jest.fn(),
    },
  }));
};

/**
 * Wait for a specific duration (useful for async operations)
 * @param {Number} ms - Milliseconds to wait
 */
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Extract cookies from response
 * @param {Object} response - Supertest response object
 * @returns {Object} Parsed cookies
 */
const extractCookies = (response) => {
  const cookies = {};
  const setCookieHeader = response.headers['set-cookie'];

  if (setCookieHeader) {
    setCookieHeader.forEach(cookie => {
      const parts = cookie.split(';')[0].split('=');
      cookies[parts[0]] = parts[1];
    });
  }

  return cookies;
};

/**
 * Clean up test files (e.g., uploaded files during tests)
 */
const cleanupTestFiles = async () => {
  // Implement file cleanup logic if needed
  // e.g., delete files from test upload directory
};

module.exports = {
  generateTestToken,
  createTestUser,
  createTestOrganizer,
  createTestAdmin,
  createTestEvent,
  createTestSlot,
  mockRedisService,
  wait,
  extractCookies,
  cleanupTestFiles,
};
