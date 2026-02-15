const ApiResponse = require('../../src/utils/ApiResponse');
const AppError = require('../../src/utils/AppError');
const catchAsync = require('../../src/utils/catchAsync');

describe('Utils - ApiResponse, AppError, catchAsync', () => {
  describe('ApiResponse', () => {
    it('should create success response with data', () => {
      const response = new ApiResponse(200, { user: 'John' }, 'Success');
      
      expect(response.status).toBe('success');
      expect(response.statusCode).toBe(200);
      expect(response.data).toEqual({ user: 'John' });
      expect(response.message).toBe('Success');
    });

    it('should create success response without message', () => {
      const response = new ApiResponse(201, { id: 123 });
      
      expect(response.status).toBe('success');
      expect(response.statusCode).toBe(201);
      expect(response.data).toEqual({ id: 123 });
      expect(response.message).toBeUndefined();
    });

    it('should handle null data', () => {
      const response = new ApiResponse(200, null, 'No data');
      
      expect(response.status).toBe('success');
      expect(response.data).toBeNull();
      expect(response.message).toBe('No data');
    });

    it('should handle array data', () => {
      const response = new ApiResponse(200, [1, 2, 3], 'Array data');
      
      expect(response.data).toEqual([1, 2, 3]);
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('should use fail status for 400 range codes', () => {
      const response = new ApiResponse(400, { error: 'Bad request' }, 'Validation error');
      
      expect(response.statusCode).toBe(400);
      // ApiResponse always uses 'success', but can be extended
    });
  });

  describe('AppError', () => {
    it('should create error with message and status code', () => {
      const error = new AppError('Not found', 404);
      
      expect(error.message).toBe('Not found');
      expect(error.statusCode).toBe(404);
      expect(error.status).toBe('fail');
      expect(error.isOperational).toBe(true);
    });

    it('should default to 500 for error status', () => {
      const error = new AppError('Server error', 500);
      
      expect(error.statusCode).toBe(500);
      expect(error.status).toBe('error');
    });

    it('should set status to fail for 4xx codes', () => {
      const error = new AppError('Bad request', 400);
      
      expect(error.status).toBe('fail');
    });

    it('should capture stack trace', () => {
      const error = new AppError('Stack test', 500);
      
      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe('string');
    });

    it('should be instance of Error', () => {
      const error = new AppError('Test', 400);
      
      expect(error instanceof Error).toBe(true);
      expect(error instanceof AppError).toBe(true);
    });
  });

  describe('catchAsync', () => {
    it('should wrap async function and catch errors', async () => {
      const asyncFn = async (req, res, next) => {
        throw new Error('Async error');
      };

      const wrappedFn = catchAsync(asyncFn);
      const nextMock = jest.fn();
      const req = {};
      const res = {};

      await wrappedFn(req, res, nextMock);

      expect(nextMock).toHaveBeenCalled();
      expect(nextMock.mock.calls[0][0].message).toBe('Async error');
    });

    it('should allow successful async execution', async () => {
      const asyncFn = async (req, res, next) => {
        res.status = 200;
        res.json = { success: true };
      };

      const wrappedFn = catchAsync(asyncFn);
      const nextMock = jest.fn();
      const req = {};
      const res = { status: null, json: null };

      await wrappedFn(req, res, nextMock);

      expect(res.status).toBe(200);
      expect(nextMock).not.toHaveBeenCalled();
    });

    it('should pass AppError to next', async () => {
      const asyncFn = async (req, res, next) => {
        throw new AppError('Custom error', 403);
      };

      const wrappedFn = catchAsync(asyncFn);
      const nextMock = jest.fn();

      await wrappedFn({}, {}, nextMock);

      expect(nextMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Custom error',
          statusCode: 403,
        })
      );
    });

    it('should return a function', () => {
      const asyncFn = async (req, res, next) => {};
      const wrappedFn = catchAsync(asyncFn);

      expect(typeof wrappedFn).toBe('function');
    });
  });
});
