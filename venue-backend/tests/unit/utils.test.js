const AppError = require('../../src/utils/AppError');
const ApiResponse = require('../../src/utils/ApiResponse');
const catchAsync = require('../../src/utils/catchAsync');

describe('Utility Functions Tests', () => {
  describe('AppError', () => {
    it('should create error with message and status code', () => {
      const error = new AppError('Test error', 400);

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.status).toBe('fail');
    });

    it('should set status to "error" for 500-level codes', () => {
      const error = new AppError('Server error', 500);

      expect(error.status).toBe('error');
    });

    it('should set status to "fail" for 400-level codes', () => {
      const error = new AppError('Client error', 404);

      expect(error.status).toBe('fail');
    });

    it('should mark error as operational', () => {
      const error = new AppError('Operational error', 400);

      expect(error.isOperational).toBe(true);
    });

    it('should capture stack trace', () => {
      const error = new AppError('Test error', 400);

      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe('string');
    });

    it('should be instance of Error', () => {
      const error = new AppError('Test error', 400);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
    });

    it('should handle different status codes correctly', () => {
      const error401 = new AppError('Unauthorized', 401);
      const error403 = new AppError('Forbidden', 403);
      const error404 = new AppError('Not found', 404);

      expect(error401.status).toBe('fail');
      expect(error403.status).toBe('fail');
      expect(error404.status).toBe('fail');
    });
  });

  describe('ApiResponse', () => {
    it('should create response with all parameters', () => {
      const response = new ApiResponse(200, { user: 'test' }, 'Success');

      expect(response.statusCode).toBe(200);
      expect(response.status).toBe('success');
      expect(response.data).toEqual({ user: 'test' });
      expect(response.message).toBe('Success');
    });

    it('should set status to "success" by default', () => {
      const response = new ApiResponse(200, {}, 'Success');

      expect(response.status).toBe('success');
    });

    it('should handle empty data object', () => {
      const response = new ApiResponse(200, {}, 'No data');

      expect(response.data).toEqual({});
    });

    it('should handle null data', () => {
      const response = new ApiResponse(204, null, 'No content');

      expect(response.data).toBeNull();
    });

    it('should handle array data', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const response = new ApiResponse(200, data, 'List retrieved');

      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data).toHaveLength(2);
    });

    it('should handle complex nested data', () => {
      const data = {
        user: {
          name: 'Test',
          bookings: [{ id: 1 }, { id: 2 }],
        },
      };
      const response = new ApiResponse(200, data, 'Complex data');

      expect(response.data.user.name).toBe('Test');
      expect(response.data.user.bookings).toHaveLength(2);
    });

    it('should create proper JSON structure', () => {
      const response = new ApiResponse(201, { id: '123' }, 'Created');
      const json = JSON.stringify(response);
      const parsed = JSON.parse(json);

      expect(parsed.statusCode).toBe(201);
      expect(parsed.status).toBe('success');
      expect(parsed.message).toBe('Created');
      expect(parsed.data.id).toBe('123');
    });
  });

  describe('catchAsync', () => {
    let req, res, next;

    beforeEach(() => {
      req = {};
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      next = jest.fn();
    });

    it('should handle successful async function', async () => {
      const asyncFn = catchAsync(async (req, res) => {
        res.status(200).json({ success: true });
      });

      await asyncFn(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true });
      expect(next).not.toHaveBeenCalled();
    });

    it('should catch errors and pass to next', async () => {
      const error = new Error('Test error');
      const asyncFn = catchAsync(async () => {
        throw error;
      });

      await asyncFn(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should handle promise rejection', async () => {
      const asyncFn = catchAsync(async () => {
        return Promise.reject(new Error('Rejected'));
      });

      await asyncFn(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should pass AppError to next middleware', async () => {
      const appError = new AppError('Custom error', 400);
      const asyncFn = catchAsync(async () => {
        throw appError;
      });

      await asyncFn(req, res, next);

      expect(next).toHaveBeenCalledWith(appError);
    });

    it('should work with multiple async operations', async () => {
      const asyncFn = catchAsync(async (req, res) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        await new Promise(resolve => setTimeout(resolve, 10));
        res.status(200).json({ done: true });
      });

      await asyncFn(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(next).not.toHaveBeenCalled();
    });

    it('should preserve request context', async () => {
      req.user = { id: '123' };

      const asyncFn = catchAsync(async (req, res) => {
        expect(req.user.id).toBe('123');
        res.status(200).json({ userId: req.user.id });
      });

      await asyncFn(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ userId: '123' });
    });
  });

  describe('Error handling integration', () => {
    it('should properly chain AppError and catchAsync', async () => {
      const next = jest.fn();
      const asyncFn = catchAsync(async () => {
        throw new AppError('Not found', 404);
      });

      await asyncFn({}, {}, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Not found',
          statusCode: 404,
          isOperational: true,
        })
      );
    });

    it('should handle nested errors correctly', async () => {
      const next = jest.fn();
      const asyncFn = catchAsync(async () => {
        try {
          throw new Error('Inner error');
        } catch (err) {
          throw new AppError('Outer error', 500);
        }
      });

      await asyncFn({}, {}, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Outer error',
          statusCode: 500,
        })
      );
    });
  });
});
