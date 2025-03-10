const { handler } = require('../netlify/functions/signin.js');
const { createClient } = require('@supabase/supabase-js');
const cookie = require('cookie');

let mockSignInWithPassword;

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signInWithPassword: jest.fn().mockImplementation(() => mockSignInWithPassword())
    }
  }))
}));

// Mock the environment variables
process.env.SUPABASE_URL = 'https://bqumdvfrgjcwcnbdbrps.supabase.co';
process.env.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxdW1kdmZyZ2pjd2NuYmRicnBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk4ODQ3NDIsImV4cCI6MjA1NTQ2MDc0Mn0.1u8pE3cLH6YjQIW1aiYUbyGiZ8__tb-ybChNf961fuE';

// Mock the CORS headers utility
jest.mock('../utils/CORS_HEADERS', () => ({
  CORS_HEADERS: () => ({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  })
}));

describe('Signin Function', () => {
  
    beforeEach(() => {
        mockSignInWithPassword = jest.fn();
    });

  it('should return a 200 status code, user data, and set a cookie for valid credentials', async () => {
    const mockUser = { id: 'test-user-id', email: 'ian@tests.com' };
    const mockSession = { access_token: 'test-access-token', refresh_token: 'test-refresh-token', expires_in: 3600 };

    mockSignInWithPassword.mockResolvedValue({
      data: {
        user: mockUser,
        session: mockSession
      },
      error: null
    });

    const event = {
      httpMethod: 'POST',
      body: JSON.stringify({ email: 'ian@tests.com', password: 'test123' }),
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty('message', 'Sign in successful');
    expect(body.user).toEqual({ email: mockUser.email, id: mockUser.id, accessToken: mockSession.access_token }); // Check for correct user data and accessToken
    expect(body).not.toHaveProperty('session'); // No session data in response
    //expect(body).not.toHaveProperty('accessToken'); // No accessToken in response

    // Check for the Set-Cookie header
    expect(response.headers).toHaveProperty('Set-Cookie');
    const setCookieHeader = response.headers['Set-Cookie'];
    expect(setCookieHeader).toMatch(`sb-auth-token=${mockSession.access_token}`); // Check for correct cookie name and value
    expect(setCookieHeader).toMatch(/HttpOnly/); // Check for HttpOnly attribute
    expect(setCookieHeader).toMatch(/Max-Age=3600/); // Check for Max-Age attribute
    expect(setCookieHeader).toMatch(/Path=\//); // Check for Path attribute
    expect(setCookieHeader).toMatch(/SameSite=None/); // Check for SameSite attribute
    // Secure attribute is intentionally omitted in the test environment
  });

    it('should return a 400 status code for invalid credentials', async () => {
        mockSignInWithPassword.mockResolvedValue({
            data: { user: null, session: null },
            error: { message: 'Invalid login credentials', status: 400 }
        });

        const event = {
            httpMethod: 'POST',
            body: JSON.stringify({ email: 'ian@tests.com', password: 'wrongpassword' }),
        };

        const response = await handler(event);
        expect(response.statusCode).toBe(400);
        const body = JSON.parse(response.body);
        expect(body).toHaveProperty('error');
    });

    it('should return a 405 status code for GET requests', async () => {
        const event = {
            httpMethod: 'GET',
            body: JSON.stringify({ email: 'ian@tests.com', password: 'test123' }),
        };

        const response = await handler(event);
        expect(response.statusCode).toBe(405);
    });
});
