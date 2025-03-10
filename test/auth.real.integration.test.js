const { handler: signinHandler } = require("../netlify/functions/signin.js");
const { createClient } = require("@supabase/supabase-js");
const lambdaLocal = require("lambda-local");

jest.mock('@supabase/supabase-js', () => {
  const mockSignInWithPassword = jest.fn();
  const mockGetUser = jest.fn();

  return {
    createClient: jest.fn(() => ({
      auth: {
        signInWithPassword: mockSignInWithPassword,
        getUser: mockGetUser,
      },
    })),
    mockSignInWithPassword, // Export the mock function
    mockGetUser, // Export the mock function
  };
});

describe("Authentication Flow Integration", () => {
  const testEmail = "ian@tests.com";
  const testPassword = "test123";
  const testUserId = 'test-user-id';
  const testAccessToken = 'test-access-token';

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'test-anon-key';

    // Reset mock implementations before each test
    require('@supabase/supabase-js').mockSignInWithPassword.mockReset();
    require('@supabase/supabase-js').mockGetUser.mockReset();
  });

  it("should sign in with correct credentials using Supabase client directly", async () => {

    const mockSignInResponse = {
      data: {
        user: {
          id: testUserId,
          email: testEmail
        },
        session: {
          access_token: testAccessToken,
          expires_in: 3600,
          user: { id: testUserId, email: testEmail }
        }
      },
      error: null
    };
    require('@supabase/supabase-js').mockSignInWithPassword.mockResolvedValue(mockSignInResponse);

    // Mock the Supabase client's auth methods
    const { data: signInData, error: signInError } =
      await require('@supabase/supabase-js').createClient().auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });

    expect(signInError).toBeNull();
    expect(signInData).toBeDefined();
    expect(signInData.user).toBeDefined();
    expect(signInData.session).toBeDefined();
    expect(signInData.user.email).toBe(testEmail);

    const mockGetUserResponse = {
      data: {
        user: {
          id: testUserId,
          email: testEmail
        }
      },
      error: null
    }
    require('@supabase/supabase-js').mockGetUser.mockResolvedValue(mockGetUserResponse);

    // Check user login status
    const { data: getUserData, error: getUserError } =
      await require('@supabase/supabase-js').createClient().auth.getUser(testAccessToken);
    expect(getUserError).toBeNull();
    expect(getUserData).toBeDefined();
    expect(getUserData.user).toBeDefined();
    expect(getUserData.user.email).toBe(testEmail);
  });

  it("should sign in with correct credentials using signin.js handler", async () => {
    const mockSignInResponse = {
      data: {
        user: {
          id: testUserId,
          email: testEmail
        },
        session: {
          access_token: testAccessToken,
          expires_in: 3600,
          user: { id: testUserId, email: testEmail }
        }
      },
      error: null
    };
    require('@supabase/supabase-js').mockSignInWithPassword.mockResolvedValue(mockSignInResponse);

    const signinEvent = {
      httpMethod: "POST",
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    };

    const result = await lambdaLocal.execute({
      event: signinEvent,
      lambdaFunc: { handler: signinHandler },
      verboseLevel: 3,
      environment: {
        SUPABASE_URL: process.env.SUPABASE_URL,
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
      },
    });

    const cookies = result.headers["Set-Cookie"].split("; ").reduce((acc, cookie) => {
      const [key, ...valueParts] = cookie.split("=");
      acc[key] = valueParts.join("=");
      return acc;
    }, {});
    const accessToken = cookies["sb-auth-token"];
    console.log("ACCESSTOKEN: ", accessToken);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    console.log("result:", result);
    console.log("body:", body);
    expect(body.message).toBe("Sign in successful");
    expect(body.user.email).toBe(testEmail);

    const mockGetUserResponse = {
      data: {
        user: {
          id: testUserId,
          email: testEmail
        }
      },
      error: null
    }
    require('@supabase/supabase-js').mockGetUser.mockResolvedValue(mockGetUserResponse);

    // Call the session handler (no Authorization header needed now)
    const sessionEvent = {
      httpMethod: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };

    const sessionResult = await lambdaLocal.execute({
      event: sessionEvent,
      lambdaFunc: {
        handler: require("../netlify/functions/session.js").handler,
      },
      verboseLevel: 3,
      environment: {
        SUPABASE_URL: process.env.SUPABASE_URL,
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
      },
    });
    console.log("sessionResult", sessionResult);
    expect(sessionResult.statusCode).toBe(200);
    const sessionBody = JSON.parse(sessionResult.body);
    expect(sessionBody.user).toBeDefined();
    expect(sessionBody.user.email).toBe(testEmail);
  });
});
