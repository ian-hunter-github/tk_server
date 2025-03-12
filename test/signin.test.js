const { handler } = require("../netlify/functions/signin.js");
const { getDatabaseInstance } = require("../utils/dbFactory.js");
const { v4: uuidv4 } = require("uuid");

// Mock dbFactory
jest.mock("../utils/dbFactory.js");

// Mock the CORS headers utility
jest.mock("../utils/CORS_HEADERS", () => ({
  CORS_HEADERS: () => ({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  }),
}));

describe("Signin Function", () => {
  beforeEach(() => {});

  it("should return a 200 status code, user data, and set a cookie for valid credentials", async () => {
    const mockSession = {
      access_token: "test_access_token",
      refresh_token: "test_refresh_token",
      expires_in: 3600,
    };

    const mockUserId = uuidv4();
    const mockUserEmail = "ian@tests.com";
    const mockUserPassword = "test123";
    const mockUser = { id: mockUserId, email: mockUserEmail };

    const mockSuperbaseResponse = {
      data: {
        session: {
          access_token: "test_access_token",
          token_type: "bearer",
          expires_in: 3600,
          refresh_token: "your_refresh_token",
          user: {
            id: mockUserId,
            email: mockUserEmail,
            created_at: "2024-03-11T12:00:00Z",
            role: "authenticated",
          },
        },
        user: {
          id: mockUserId,
          email: mockUserEmail,
          created_at: "2024-03-11T12:00:00Z",
          role: "authenticated",
        },
      },
      error: null,
    };

    jest.clearAllMocks();

    let mockDb = {
      signIn: jest.fn().mockResolvedValue(mockSuperbaseResponse),
      getSession: jest.fn().mockResolvedValue(mockSession),
    };

    getDatabaseInstance.mockReturnValue(mockDb);

    const event = {
      httpMethod: "POST",
      body: JSON.stringify({
        email: mockUserEmail,
        password: mockUserPassword,
      }),
    };

    const response = await handler(event);

    expect(mockDb.signIn).toHaveBeenCalledWith(mockUserEmail, mockUserPassword);
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty("message", "Sign in successful");
    expect(body.user).toEqual({
      email: mockUser.email,
      id: mockUser.id,
      accessToken: mockSession.access_token,
    });
    expect(body).not.toHaveProperty("session");

    // Check for the Set-Cookie header
    expect(response.headers).toHaveProperty("Set-Cookie");
    const setCookieHeader = response.headers["Set-Cookie"];
    expect(setCookieHeader).toMatch(
      `sb-auth-token=${mockSession.access_token}`
    );
    expect(setCookieHeader).toMatch(/HttpOnly/);
    expect(setCookieHeader).toMatch(/Max-Age=3600/);
    expect(setCookieHeader).toMatch(/Path=\//);
    expect(setCookieHeader).toMatch(/SameSite=None/);
  });

  it("should return a 400 status code for invalid credentials", async () => {
    const mockSession = {
      access_token: "test_access_token",
      refresh_token: "test_refresh_token",
      expires_in: 3600,
    };

    const mockUserEmail = "ian@tests.com";

    const mockSuperbaseResponse = {
      data: null,
      error: { message: "Invalid login credentials", status: 400 },
    };

    jest.clearAllMocks();

    let mockDb = {
      signIn: jest.fn().mockResolvedValue(mockSuperbaseResponse),
      getSession: jest.fn().mockResolvedValue(mockSession),
    };

    getDatabaseInstance.mockReturnValue(mockDb);

    const event = {
        httpMethod: "POST",
        body: JSON.stringify({
          email: mockUserEmail,
          password: "wrongpassword",
        }),
      };

    const response = await handler(event);

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty("error");

  });

  it("should return a 405 status code for GET requests", async () => {
    const event = {
      httpMethod: "GET",
      body: JSON.stringify({ email: "ian@tests.com", password: "test123" }),
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(405);
  });

});
