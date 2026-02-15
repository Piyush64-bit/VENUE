const globalErrorHandler = require('../../src/middlewares/globalErrorHandler');
const AppError = require('../../src/utils/AppError');

describe('Global Error Handler Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      method: 'GET',
      originalUrl: '/api/test',
      id: 'test-request-id',
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    next = jest.fn();

    // Mock NODE_ENV
    process.env.NODE_ENV = 'test';
  });

  describe('Development mode error handling', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('should return full error details in development mode', () => {
      const error = new AppError('Test error', 400);
      error.stack = 'Error stack trace';

      globalErrorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'fail',
          message: 'Test error',
          stack: expect.any(String),
          requestId: 'test-request-id',
        })
      );
    });

    it('should include error object in development mode', () => {
      const error = new AppError('Dev error', 500);

      globalErrorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(Object),
        })
      );
    });
  });

  describe('Production mode error handling', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    it('should handle MongoDB CastError', () => {
      const error = {
        name: 'CastError',
        path: '_id',
        value: 'invalid-id',
        statusCode: 500,
        status: 'error',
      };

      globalErrorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'Invalid _id: invalid-id',
        requestId: 'test-request-id',
      });
    });

    it('should handle MongoDB ValidationError', () => {
      const error = {
        name: 'ValidationError',
        errors: {
          email: { message: 'Email is required' },
          name: { message: 'Name is required' },
        },
        statusCode: 500,
        status: 'error',
      };

      globalErrorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'Validation failed',
        errors: expect.arrayContaining([
          'Email is required',
          'Name is required',
        ]),
        requestId: 'test-request-id',
      });
    });

    it('should handle MongoDB duplicate key error (11000)', () => {
      const error = {
        code: 11000,
        keyValue: { email: 'test@example.com' },
        statusCode: 500,
        status: 'error',
      };

      globalErrorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'email already exists',
        requestId: 'test-request-id',
      });
    });

    it('should handle JsonWebTokenError', () => {
      const error = {
        name: 'JsonWebTokenError',
        message: 'jwt malformed',
        statusCode: 500,
        status: 'error',
      };

      globalErrorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'Invalid token. Please log in again.',
        requestId: 'test-request-id',
      });
    });

    it('should handle TokenExpiredError', () => {
      const error = {
        name: 'TokenExpiredError',
        message: 'jwt expired',
        statusCode: 500,
        status: 'error',
      };

      globalErrorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'Your token has expired. Please log in again.',
        requestId: 'test-request-id',
      });
    });

    it('should handle operational errors with custom status code', () => {
      const error = new AppError('Custom error message', 403);
      error.isOperational = true;

      globalErrorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should default to 500 status code for unknown errors', () => {
      const error = new Error('Unknown error');

      globalErrorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should default to error status for unknown errors', () => {
      const error = new Error('Generic error');

      globalErrorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
        })
      );
    });
  });

  describe('Request logging', () => {
    it('should include request metadata in error log', () => {
      const error = new AppError('Test error', 400);

      globalErrorHandler(error, req, res, next);

      // Error handler should process the error without throwing
      expect(res.status).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });

    it('should handle errors without request ID gracefully', () => {
      delete req.id;
      const error = new AppError('Test error', 400);

      globalErrorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Error status code handling', () => {
    it('should preserve 400 status code', () => {
      const error = new AppError('Bad request', 400);

      globalErrorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should preserve 404 status code', () => {
      const error = new AppError('Not found', 404);

      globalErrorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should preserve 500 status code', () => {
      const error = new AppError('Server error', 500);

      globalErrorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
