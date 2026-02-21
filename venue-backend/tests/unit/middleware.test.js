const verifyToken = require('../../src/middlewares/verifyToken');
const checkRole = require('../../src/middlewares/checkRole');
const validateId = require('../../src/middlewares/validateId');
const validateRequest = require('../../src/middlewares/validateRequest');
const jwt = require('jsonwebtoken');
const { z } = require('zod');

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('../../src/modules/users/user.model', () => ({
  findById: jest.fn(),
}));

const User = require('../../src/modules/users/user.model');

describe('Authentication Middleware Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      cookies: {},
      headers: {},
      params: {},
      body: {},
      query: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    next = jest.fn();

    process.env.JWT_SECRET = 'test-secret';
    jest.clearAllMocks();
  });

  describe('verifyToken middleware', () => {
    it('should verify valid token from cookie and set req.user from DB', async () => {
      const mockDecoded = {
        userId: '507f1f77bcf86cd799439011',
        role: 'USER',
      };
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Test User',
        email: 'test@test.com',
        role: 'USER',
      };

      req.cookies.token = 'valid-token';
      jwt.verify.mockReturnValue(mockDecoded);
      User.findById.mockResolvedValue(mockUser);

      await verifyToken(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
      expect(User.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(req.user).toBe(mockUser);
      expect(next).toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(); // called without error
    });

    it('should verify valid token from Authorization header', async () => {
      const mockDecoded = {
        userId: '507f1f77bcf86cd799439011',
        role: 'USER',
      };
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        role: 'USER',
      };

      req.headers.authorization = 'Bearer valid-token';
      jwt.verify.mockReturnValue(mockDecoded);
      User.findById.mockResolvedValue(mockUser);

      await verifyToken(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
      expect(req.user).toBe(mockUser);
      expect(next).toHaveBeenCalled();
    });

    it('should call next with AppError when no token provided', async () => {
      await verifyToken(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: expect.stringContaining('not logged in'),
        })
      );
    });

    it('should call next with AppError for invalid token', async () => {
      req.cookies.token = 'invalid-token';
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await verifyToken(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: expect.stringContaining('Invalid token'),
        })
      );
    });

    it('should call next with AppError for expired token', async () => {
      req.cookies.token = 'expired-token';
      const error = new Error('Token expired');
      error.name = 'TokenExpiredError';
      jwt.verify.mockImplementation(() => {
        throw error;
      });

      await verifyToken(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
        })
      );
    });

    it('should prefer cookie over no header', async () => {
      const mockDecoded = { userId: '507f1f77bcf86cd799439011', role: 'USER' };
      const mockUser = { _id: '507f1f77bcf86cd799439011', role: 'USER' };

      req.cookies.token = 'cookie-token';
      jwt.verify.mockReturnValue(mockDecoded);
      User.findById.mockResolvedValue(mockUser);

      await verifyToken(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith('cookie-token', 'test-secret');
    });

    it('should call next with AppError when user no longer exists', async () => {
      const mockDecoded = { userId: '507f1f77bcf86cd799439011', role: 'USER' };

      req.cookies.token = 'valid-token';
      jwt.verify.mockReturnValue(mockDecoded);
      User.findById.mockResolvedValue(null);

      await verifyToken(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: expect.stringContaining('no longer exists'),
        })
      );
    });
  });

  describe('checkRole middleware', () => {
    it('should allow access for user with correct role', () => {
      req.user = { userId: '123', role: 'ADMIN' };

      const middleware = checkRole(['ADMIN']);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow access for user with one of multiple allowed roles', () => {
      req.user = { userId: '123', role: 'ORGANIZER' };

      const middleware = checkRole(['ADMIN', 'ORGANIZER']);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny access for user without required role', () => {
      req.user = { userId: '123', role: 'USER' };

      const middleware = checkRole(['ADMIN']);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Access denied',
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when user object is missing', () => {
      req.user = undefined;

      const middleware = checkRole(['ADMIN']);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User not authenticated',
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should deny access when role is missing from user object', () => {
      req.user = { userId: '123' };

      const middleware = checkRole(['ADMIN']);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle empty allowed roles array', () => {
      req.user = { userId: '123', role: 'USER' };

      const middleware = checkRole([]);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('should be case-sensitive for role matching', () => {
      req.user = { userId: '123', role: 'admin' };

      const middleware = checkRole(['ADMIN']);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('validateId middleware', () => {
    it('should pass valid MongoDB ObjectId', () => {
      req.params = { id: '507f1f77bcf86cd799439011' };

      const middleware = validateId('id');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(); // called without error
    });

    it('should call next with AppError for invalid MongoDB ObjectId', () => {
      req.params = { id: 'invalid-id' };

      const middleware = validateId('id');
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: expect.stringContaining('Invalid'),
        })
      );
    });

    it('should pass when param is not present (undefined)', () => {
      req.params = {};

      const middleware = validateId('id');
      middleware(req, res, next);

      // validateId only checks if value exists AND is invalid
      expect(next).toHaveBeenCalled();
    });

    it('should validate multiple param names', () => {
      req.params = {
        userId: '507f1f77bcf86cd799439011',
        eventId: 'invalid-id',
      };

      const middleware = validateId('userId', 'eventId');
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: expect.stringContaining('Invalid'),
        })
      );
    });
  });

  describe('validateRequest middleware', () => {
    it('should pass valid request body', async () => {
      const schema = z.object({
        body: z.object({
          email: z.string().email(),
          name: z.string().min(2),
        }),
      });

      req.body = {
        email: 'test@example.com',
        name: 'John Doe',
      };

      const middleware = validateRequest(schema);
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(); // called without error
    });

    it('should call next with AppError for invalid request body', async () => {
      const schema = z.object({
        body: z.object({
          email: z.string().email(),
          name: z.string().min(2),
        }),
      });

      req.body = {
        email: 'invalid-email',
        name: 'J',
      };

      const middleware = validateRequest(schema);
      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
        })
      );
    });

    it('should call next with AppError for missing required fields', async () => {
      const schema = z.object({
        body: z.object({
          email: z.string().email(),
          password: z.string().min(8),
        }),
      });

      req.body = {
        email: 'test@example.com',
        // password missing
      };

      const middleware = validateRequest(schema);
      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
        })
      );
    });
  });
});
