const { handler: signupHandler } = require('../netlify/functions/signup.js');
const { handler: signinHandler } = require('../netlify/functions/signin.js');
const DatasourceInterface = require('../utils/DatasourceInterface');

// Mock responses
let mockSignUp;
let mockSignIn;

// Create a mock implementation of DatasourceInterface
class MockDatasource extends DatasourceInterface {
  async signIn(email, password) {
    return mockSignIn();
  }
  
  // Add signUp method even though it's not in the interface yet
  // This is to prepare for future refactoring of the signup.js handler
  async signUp(email, password) {
    return mockSignUp();
  }
}

// Mock the DbFactory to return our mock datasource
jest.mock('../utils/dbFactory', () => ({
  getDatabaseInstance: jest.fn(() => new MockDatasource())
}));

// For signup.js which still uses Supabase directly
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signUp: jest.fn().mockImplementation(() => mockSignUp())
    }
  }))
}));

// Mock CORS headers
jest.mock('../utils/CORS_HEADERS', () => ({
  CORS_HEADERS: () => ({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  })
}));

describe('Authentication Flow Integration', () => {
  const testEmail = 'ian@tests.com';
  const testPassword = 'test123';
  const testUserId = 'test-user-id';
  const testAccessToken = 'test-access-token';

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Set environment variables
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.DB_TYPE = 'supabase';
  });

  it('should handle signup failure gracefully', async () => {
    // Set up mock responses
    mockSignUp = jest.fn().mockResolvedValue({
      data: { user: null, session: null },
      error: {
        message: 'Email already registered',
        status: 400
      }
    });

    const signupEvent = {
      httpMethod: 'POST',
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    };

    const response = await signupHandler(signupEvent);
    expect(response.statusCode).toBe(400);
    
    const body = JSON.parse(response.body);
    expect(body.error).toBe('Email already registered');
  });

  it('should handle signin failure after successful signup', async () => {
     // Set up mock responses for successful signup
    mockSignUp = jest.fn().mockResolvedValue({
      data: {
        user: {
          id: testUserId,
          email: testEmail
        },
        session: null
      },
      error: null
    });

    // Set up mock responses for failed signin
    mockSignIn = jest.fn().mockResolvedValue({
      data: { user: null, session: null },
      error: {
        message: 'Invalid login credentials',
        status: 400
      }
    });

    // First, perform a successful signup
    const signupEvent = {
      httpMethod: 'POST',
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    };

    const signupResponse = await signupHandler(signupEvent);
    expect(signupResponse.statusCode).toBe(200); // Expect signup to succeed

    // Now, attempt to sign in with incorrect credentials (or however the failure is triggered)
    const signinEvent = {
      httpMethod: 'POST',
      body: JSON.stringify({
        email: testEmail,
        password: 'wrongpassword' // Example: Using a wrong password
      })
    };

    const signinResponse = await signinHandler(signinEvent);
    expect(signinResponse.statusCode).toBe(400); // Expect signin to fail

    const signinBody = JSON.parse(signinResponse.body);
    expect(signinBody.error).toBe('Invalid login credentials');
  });

  it('should handle invalid request bodies', async () => {
    const signupEvent = {
      httpMethod: 'POST',
      body: 'invalid json'
    };

    const response = await signupHandler(signupEvent);
    expect(response.statusCode).toBe(400);
    
    const body = JSON.parse(response.body);
    expect(body.error).toBe('Invalid JSON in request body');
  });

  it('should handle missing credentials', async () => {
    const signupEvent = {
      httpMethod: 'POST',
      body: JSON.stringify({
        // Missing password
        email: testEmail
      })
    };

    const response = await signupHandler(signupEvent);
    expect(response.statusCode).toBe(400);
    
    const body = JSON.parse(response.body);
    expect(body.error).toBe('Email and password are required');

    // Verify Supabase was not called
    expect(mockSignUp).not.toHaveBeenCalled();
  });
});
