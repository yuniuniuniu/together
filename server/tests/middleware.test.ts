import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate, generateToken, type AuthRequest } from '../src/middleware/auth.js';
import { validate, patterns } from '../src/middleware/validate.js';
import { AppError, errorHandler } from '../src/middleware/errorHandler.js';
import { getDatabase } from '../src/db/database.js';

// Mock the database
vi.mock('../src/db/database.js', () => ({
  getDatabase: vi.fn(),
}));

const mockGetDatabase = vi.mocked(getDatabase);

describe('Auth Middleware', () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      headers: {},
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    mockNext = vi.fn();
    vi.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should call next with error when no authorization header', async () => {
      await authenticate(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
    });

    it('should call next with error when authorization header is invalid format', async () => {
      mockReq.headers = { authorization: 'InvalidFormat token' };

      await authenticate(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
    });

    it('should call next with error when token is invalid', async () => {
      mockReq.headers = { authorization: 'Bearer invalid-token' };

      await authenticate(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('INVALID_TOKEN');
    });

    it('should call next with error when user not found', async () => {
      const token = jwt.sign({ userId: 'non-existent' }, process.env.JWT_SECRET || 'dev-secret-key');
      mockReq.headers = { authorization: `Bearer ${token}` };

      mockGetDatabase.mockReturnValue({
        getUserById: vi.fn().mockResolvedValue(null),
      } as any);

      await authenticate(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('USER_NOT_FOUND');
    });

    it('should set user on request and call next when valid token', async () => {
      const userId = 'test-user-id';
      const token = jwt.sign({ userId }, process.env.JWT_SECRET || 'dev-secret-key');
      mockReq.headers = { authorization: `Bearer ${token}` };

      const mockUser = {
        id: userId,
        phone: '+1234567890',
        nickname: 'Test User',
        avatar: 'https://example.com/avatar.jpg',
      };

      mockGetDatabase.mockReturnValue({
        getUserById: vi.fn().mockResolvedValue(mockUser),
      } as any);

      await authenticate(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockReq.user).toEqual({
        id: userId,
        phone: '+1234567890',
        nickname: 'Test User',
        avatar: 'https://example.com/avatar.jpg',
      });
    });

    it('should handle user without optional fields', async () => {
      const userId = 'test-user-id';
      const token = jwt.sign({ userId }, process.env.JWT_SECRET || 'dev-secret-key');
      mockReq.headers = { authorization: `Bearer ${token}` };

      const mockUser = {
        id: userId,
        phone: null,
        nickname: 'Test User',
        avatar: null,
      };

      mockGetDatabase.mockReturnValue({
        getUserById: vi.fn().mockResolvedValue(mockUser),
      } as any);

      await authenticate(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockReq.user).toEqual({
        id: userId,
        phone: '',
        nickname: 'Test User',
        avatar: undefined,
      });
    });
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const userId = 'test-user-id';
      const token = generateToken(userId);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key') as { userId: string };
      expect(decoded.userId).toBe(userId);
    });

    it('should generate token with 7 day expiry', () => {
      const userId = 'test-user-id';
      const token = generateToken(userId);

      const decoded = jwt.decode(token) as { exp: number; iat: number };
      const expiryDays = (decoded.exp - decoded.iat) / (60 * 60 * 24);
      expect(expiryDays).toBe(7);
    });
  });
});

describe('Validate Middleware', () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      body: {},
    };
    mockRes = {};
    mockNext = vi.fn();
    vi.clearAllMocks();
  });

  describe('required fields', () => {
    it('should call next with error when required field is missing', () => {
      const validator = validate({
        name: { required: true },
      });

      validator(mockReq as any, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.message).toContain('name is required');
    });

    it('should call next with error when required field is empty string', () => {
      mockReq.body = { name: '' };
      const validator = validate({
        name: { required: true },
      });

      validator(mockReq as any, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should call next with error when required field is null', () => {
      mockReq.body = { name: null };
      const validator = validate({
        name: { required: true },
      });

      validator(mockReq as any, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should pass when required field is provided', () => {
      mockReq.body = { name: 'Test' };
      const validator = validate({
        name: { required: true },
      });

      validator(mockReq as any, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('type validation', () => {
    it('should validate string type', () => {
      mockReq.body = { name: 123 };
      const validator = validate({
        name: { type: 'string' },
      });

      validator(mockReq as any, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.message).toContain('name must be a string');
    });

    it('should validate number type', () => {
      mockReq.body = { age: 'twenty' };
      const validator = validate({
        age: { type: 'number' },
      });

      validator(mockReq as any, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.message).toContain('age must be a number');
    });

    it('should validate boolean type', () => {
      mockReq.body = { active: 'yes' };
      const validator = validate({
        active: { type: 'boolean' },
      });

      validator(mockReq as any, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should validate array type', () => {
      mockReq.body = { items: 'not-array' };
      const validator = validate({
        items: { type: 'array' },
      });

      validator(mockReq as any, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.message).toContain('items must be a array');
    });

    it('should pass valid array', () => {
      mockReq.body = { items: [1, 2, 3] };
      const validator = validate({
        items: { type: 'array' },
      });

      validator(mockReq as any, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should validate object type', () => {
      mockReq.body = { data: 'not-object' };
      const validator = validate({
        data: { type: 'object' },
      });

      validator(mockReq as any, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('pattern validation', () => {
    it('should validate pattern', () => {
      mockReq.body = { email: 'invalid-email' };
      const validator = validate({
        email: { pattern: patterns.email },
      });

      validator(mockReq as any, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.message).toContain('email has invalid format');
    });

    it('should pass valid pattern', () => {
      mockReq.body = { email: 'test@example.com' };
      const validator = validate({
        email: { pattern: patterns.email },
      });

      validator(mockReq as any, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('length validation', () => {
    it('should validate minLength', () => {
      mockReq.body = { password: '123' };
      const validator = validate({
        password: { minLength: 6 },
      });

      validator(mockReq as any, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.message).toContain('password must be at least 6 characters');
    });

    it('should validate maxLength', () => {
      mockReq.body = { username: 'verylongusername' };
      const validator = validate({
        username: { maxLength: 10 },
      });

      validator(mockReq as any, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.message).toContain('username must be at most 10 characters');
    });
  });

  describe('number range validation', () => {
    it('should validate min value', () => {
      mockReq.body = { age: 15 };
      const validator = validate({
        age: { type: 'number', min: 18 },
      });

      validator(mockReq as any, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.message).toContain('age must be at least 18');
    });

    it('should validate max value', () => {
      mockReq.body = { quantity: 150 };
      const validator = validate({
        quantity: { type: 'number', max: 100 },
      });

      validator(mockReq as any, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.message).toContain('quantity must be at most 100');
    });

    it('should pass value within range', () => {
      mockReq.body = { age: 25 };
      const validator = validate({
        age: { type: 'number', min: 18, max: 65 },
      });

      validator(mockReq as any, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('optional fields', () => {
    it('should skip validation for undefined optional fields', () => {
      mockReq.body = {};
      const validator = validate({
        nickname: { minLength: 3 },
      });

      validator(mockReq as any, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should skip validation for null optional fields', () => {
      mockReq.body = { nickname: null };
      const validator = validate({
        nickname: { minLength: 3 },
      });

      validator(mockReq as any, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('multiple errors', () => {
    it('should return all validation errors', () => {
      mockReq.body = {};
      const validator = validate({
        name: { required: true },
        email: { required: true },
      });

      validator(mockReq as any, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.message).toContain('name is required');
      expect(error.message).toContain('email is required');
    });
  });
});

describe('Patterns', () => {
  describe('phone pattern', () => {
    it('should match valid phone numbers', () => {
      expect(patterns.phone.test('+1234567890')).toBe(true);
      expect(patterns.phone.test('1234567890')).toBe(true);
      expect(patterns.phone.test('+8613800138000')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(patterns.phone.test('123')).toBe(false);
      expect(patterns.phone.test('abcdefghij')).toBe(false);
      expect(patterns.phone.test('+0123456789')).toBe(false);
    });
  });

  describe('email pattern', () => {
    it('should match valid emails', () => {
      expect(patterns.email.test('test@example.com')).toBe(true);
      expect(patterns.email.test('user.name@domain.co.uk')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(patterns.email.test('invalid')).toBe(false);
      expect(patterns.email.test('@domain.com')).toBe(false);
      expect(patterns.email.test('user@')).toBe(false);
    });
  });

  describe('code pattern', () => {
    it('should match 6-digit codes', () => {
      expect(patterns.code.test('123456')).toBe(true);
      expect(patterns.code.test('000000')).toBe(true);
    });

    it('should reject invalid codes', () => {
      expect(patterns.code.test('12345')).toBe(false);
      expect(patterns.code.test('1234567')).toBe(false);
      expect(patterns.code.test('abcdef')).toBe(false);
    });
  });
});

describe('Error Handler Middleware', () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    mockNext = vi.fn();
    vi.clearAllMocks();
  });

  describe('AppError class', () => {
    it('should create AppError with correct properties', () => {
      const error = new AppError(400, 'BAD_REQUEST', 'Invalid input');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('BAD_REQUEST');
      expect(error.message).toBe('Invalid input');
      expect(error.name).toBe('AppError');
    });
  });

  describe('errorHandler', () => {
    it('should handle AppError correctly', () => {
      const error = new AppError(400, 'BAD_REQUEST', 'Invalid input');

      errorHandler(error, mockReq as any, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid input',
        error: { code: 'BAD_REQUEST' },
      });
    });

    it('should handle 401 AppError', () => {
      const error = new AppError(401, 'UNAUTHORIZED', 'Not authenticated');

      errorHandler(error, mockReq as any, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Not authenticated',
        error: { code: 'UNAUTHORIZED' },
      });
    });

    it('should handle 404 AppError', () => {
      const error = new AppError(404, 'NOT_FOUND', 'Resource not found');

      errorHandler(error, mockReq as any, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Resource not found',
        error: { code: 'NOT_FOUND' },
      });
    });

    it('should handle unexpected errors with 500 status', () => {
      const error = new Error('Unexpected error');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      errorHandler(error, mockReq as any, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
      });
      expect(consoleSpy).toHaveBeenCalledWith('Unexpected error:', error);

      consoleSpy.mockRestore();
    });

    it('should not expose internal error details', () => {
      const error = new Error('Database connection failed: password incorrect');
      vi.spyOn(console, 'error').mockImplementation(() => {});

      errorHandler(error, mockReq as any, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
      });
    });
  });
});
