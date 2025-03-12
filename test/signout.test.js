const { handler } = require('../netlify/functions/signout.js');
const cookie = require('cookie');

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signOut: jest.fn().mockResolvedValue({ error: null })
    }
  }))
}));

// Mock the CORS headers utility
jest.mock('../utils/CORS_HEADERS', () => ({
  CORS_HEADERS: () => ({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  })
}));

describe('Signout Function', () => {
    it('should return a 200 status code and set expired cookie on successful signout', async () => {
        const event = {
            httpMethod: 'POST', // Method doesn't matter anymore
        };

        const response = await handler(event);
        expect(response.statusCode).toBe(200);
        expect(JSON.parse(response.body)).toEqual({ message: 'Sign out successful' });

        // Check for the Set-Cookie header with an expired cookie
        expect(response.headers).toHaveProperty('Set-Cookie');
        const cookies = cookie.parse(response.headers['Set-Cookie']);
        expect(cookies).toHaveProperty('sb-auth-token'); // Check for correct cookie name
        expect(cookies['sb-auth-token']).toBe(''); // Should be cleared
        const setCookieHeader = response.headers['Set-Cookie'];
        expect(setCookieHeader).toMatch(/sb-auth-token=/);
        expect(setCookieHeader).toMatch(/Path=\//);
        expect(setCookieHeader).toMatch(/HttpOnly/);
        expect(setCookieHeader).toMatch(/SameSite=None/);
        expect(setCookieHeader).toMatch(/Expires=Thu, 01 Jan 1970 00:00:00 GMT/);
    });
});
