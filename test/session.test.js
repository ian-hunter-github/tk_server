const { handler } = require('../netlify/functions/session');
const { createClient } = require('@supabase/supabase-js');
const { CORS_HEADERS } = require('../utils/CORS_HEADERS');
const { getSessionToken } = require('../utils/getSessionToken');

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

jest.mock('../utils/CORS_HEADERS', () => ({
  CORS_HEADERS: jest.fn().mockReturnValue({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  }),
}));

jest.mock('../utils/getSessionToken', () => ({
  getSessionToken: jest.fn(),
}));

describe('Session Handler', () => {
  let mockSupabase;

  beforeEach(() => {
    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
    };
    createClient.mockReturnValue(mockSupabase);
    // Reset environment variables before each test
    process.env.SUPABASE_URL = 'test_url';
    process.env.SUPABASE_ANON_KEY = 'test_key';
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Restore environment variables after each test
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_ANON_KEY;
  });

  it('handles OPTIONS requests', async () => {
    const event = { httpMethod: 'OPTIONS' };
    const response = await handler(event);
    expect(response.statusCode).toBe(204);
    expect(CORS_HEADERS).toHaveBeenCalledWith(event);
  });

  it('returns 401 if no session token is found', async () => {
    const event = { httpMethod: 'GET', headers: {} };
    getSessionToken.mockReturnValue(null);
    const response = await handler(event);
    expect(response.statusCode).toBe(401);
    expect(response.body).toBe(JSON.stringify({ error: 'No session token found' }));
    expect(CORS_HEADERS).toHaveBeenCalledWith(event);
  });

  it('returns 401 if Supabase returns an error', async () => {
    const event = { httpMethod: 'GET', headers: { Authorization: 'Bearer token' } };
    getSessionToken.mockReturnValue('token');
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid token' },
    });
    const response = await handler(event);
    expect(response.statusCode).toBe(401);
    expect(response.body).toBe(JSON.stringify({ error: 'Invalid token' }));
    expect(CORS_HEADERS).toHaveBeenCalledWith(event);
  });

  it('returns 401 if no user is found', async () => {
    const event = { httpMethod: 'GET', headers: { Authorization: 'Bearer token' } };
    getSessionToken.mockReturnValue('token');
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });
    const response = await handler(event);
    expect(response.statusCode).toBe(401);
    expect(response.body).toBe(JSON.stringify({ error: 'No user found' }));
    expect(CORS_HEADERS).toHaveBeenCalledWith(event);
  });

  it('returns 200 with user data on successful authentication', async () => {
    const event = { httpMethod: 'GET', headers: { Authorization: 'Bearer token' } };
    const mockUser = { id: '123', email: 'test@example.com' };
    getSessionToken.mockReturnValue('token');
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    expect(response.body).toBe(JSON.stringify({ user: mockUser }));
    expect(CORS_HEADERS).toHaveBeenCalledWith(event);
  });

    it('returns 500 if Supabase environment variables are not set', async () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_ANON_KEY;
    const event = { httpMethod: 'GET' };
    const response = await handler(event);
    expect(response.statusCode).toBe(500);
    expect(response.body).toBe(JSON.stringify({ error: "Supabase environment variables not set" }));
  });

  it('returns 405 for unsupported methods', async () => {
    const event = { httpMethod: 'POST' };
    const response = await handler(event);
    expect(response.statusCode).toBe(405);
    expect(response.body).toBe(JSON.stringify({ error: 'Method Not Allowed' }));
    expect(CORS_HEADERS).toHaveBeenCalledWith(event);
  });
    it('returns 500 on unexpected error', async () => {
        const event = { httpMethod: 'GET', headers: { Authorization: 'Bearer token' } };
        getSessionToken.mockReturnValue('token');
        mockSupabase.auth.getUser.mockRejectedValue(new Error('Unexpected error'));
        const response = await handler(event);
        expect(response.statusCode).toBe(500);
        expect(response.body).toBe(JSON.stringify({ error: 'Failed to retrieve user data.' }));
        expect(CORS_HEADERS).toHaveBeenCalledWith(event);
    });
});
