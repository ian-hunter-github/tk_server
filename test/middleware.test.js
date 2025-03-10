const { authMiddleware } = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const cookie = require('cookie');
const { createClient } = require('@supabase/supabase-js');

// Mock jsonwebtoken
jest.mock('jsonwebtoken');

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
    createClient: jest.fn(),
}));

describe('authMiddleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SUPABASE_JWT_SECRET = 'test-jwt-secret'; // Set a mock secret
    process.env.SUPABASE_URL = 'test-url';
    process.env.SUPABASE_ANON_KEY = 'test-anon-key';
  });

  it('should attach userId to req and call next() if token is valid', async () => {
    const mockUserId = 'test-user-id';
    const mockToken = 'test-token';
    const mockDecodedToken = { sub: mockUserId };

    jwt.verify.mockReturnValue(mockDecodedToken);
    createClient.mockReturnValue({}); // Mock the Supabase client creation

    const req = {
      headers: {
        cookie: cookie.serialize('sb-auth-token', mockToken),
      },
    };
    const res = {}; // We don't need to mock the response for this test
    const next = jest.fn();

    const result = await authMiddleware(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith(mockToken, 'test-jwt-secret');
    expect(req.userId).toBe(mockUserId);
    expect(next).toHaveBeenCalled();
    expect(result).toBeUndefined(); // authMiddleware doesn't return anything when successful
  });

  it('should return 401 if no token is provided', async () => {
    const req = {
      headers: {
        cookie: '', // No cookie
      },
    };
    const res = {};
    const next = jest.fn();

    const result = await authMiddleware(req, res, next);

    expect(result.statusCode).toBe(401);
    expect(JSON.parse(result.body).error).toBe("Unauthorized: No token provided");
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if token is invalid', async () => {
    const mockToken = 'invalid-token';
    jwt.verify.mockImplementation(() => {
      throw new Error('Invalid token');
    });

    const req = {
      headers: {
        cookie: cookie.serialize('sb-auth-token', mockToken),
      },
    };
    const res = {};
    const next = jest.fn();

    const result = await authMiddleware(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith(mockToken, 'test-jwt-secret');
    expect(result.statusCode).toBe(401);
    expect(JSON.parse(result.body).error).toBe("Unauthorized: Invalid token");
    expect(next).not.toHaveBeenCalled();
  });
});
