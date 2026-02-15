const verifyToken = require('../../src/middlewares/verifyToken');
const checkRole = require('../../src/middlewares/checkRole');
const jwt = require('jsonwebtoken');

jest.mock('jsonwebtoken');

describe('Authentication Middleware Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      cookies: {},
      headers: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    next = jest.fn();

    process.env.JWT_SECRET = 'test-secret';
  });

  describe('verifyToken middleware', () => {
    it('should verify valid token from cookie', () => {
      const mockDecoded = {
        userId: '507f1f77bcf86cd799439011',
        role: 'USER',
      };

      req.cookies.token = 'valid-token';
      jwt.verify.mockReturnValue(mockDecoded);

      verifyToken(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
      expect(req.user).toEqual(mockDecoded);
      expect(next).toHaveBeenCalled();
    });

    it('should verify valid token from Authorization header', () => {
      const mockDecoded = {
        userId: '507f1f77bcf86cd799439011',
        role: 'USER',
      };

      req.headers.authorization = 'Bearer valid-token';
      jwt.verify.mockReturnValue(mockDecoded);

      verifyToken(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
      expect(req.user).toEqual(mockDecoded);
      expect(next).toHaveBeenCalled();
    });

    it('should return 401 when no token provided', () => {
      verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'fail',
          message: expect.stringContaining('token'),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 for invalid token', () => {
      req.cookies.token = 'invalid-token';
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 for expired token', () => {
      req.cookies.token = 'expired-token';
      const error = new Error('Token expired');
      error.name = 'TokenExpiredError';
      jwt.verify.mockImplementation(() => {
        throw error;
      });

      verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should prefer Authorization header over cookie', () => {
      const mockDecoded = {
        userId: '507f1f77bcf86cd799439011',
        role: 'USER',
      };

      req.cookies.token = 'cookie-token';
      req.headers.authorization = 'Bearer header-token';
      jwt.verify.mockReturnValue(mockDecoded);

      verifyToken(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith('header-token', 'test-secret');
    });

    it('should handle malformed Authorization header', () => {
      req.headers.authorization = 'InvalidFormat token';

      verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
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
          status: 'fail',
          message: expect.stringContaining('permission'),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should deny access when user object is missing', () => {
      req.user = undefined;

      const middleware = checkRole(['ADMIN']);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
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
    const validateId = require('../../src/middlewares/validateId');
    const mongoose = require('mongoose');

    it('should pass valid MongoDB ObjectId', () => {
      req.params = { id: '507f1f77bcf86cd799439011' };

      validateId(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject invalid MongoDB ObjectId', () => {
      req.params = { id: 'invalid-id' };

      validateId(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'fail',
          message: expect.stringContaining('Invalid'),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject empty ID', () => {
      req.params = { id: '' };

      validateId(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject undefined ID', () => {
      req.params = {};

      validateId(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('validateRequest middleware', () => {
    const validateRequest = require('../../src/middlewares/validateRequest');
    const { z } = require('zod');

    it('should pass valid request body', () => {
      const schema = z.object({
        email: z.string().email(),
        name: z.string().min(2),
      });

      req.body = {
        email: 'test@example.com',
        name: 'John Doe',
      };

      const middleware = validateRequest(schema);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject invalid request body', () => {
      const schema = z.object({
        email: z.string().email(),
        name: z.string().min(2),
      });

      req.body = {
        email: 'invalid-email',
        name: 'J',
      };

      const middleware = validateRequest(schema);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'fail',
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject missing required fields', () => {
      const schema = z.object({
        email: z.string().email(),
        password: z.string().min(8),
      });

      req.body = {
        email: 'test@example.com',
        // password missing
      };

      const middleware = validateRequest(schema);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
