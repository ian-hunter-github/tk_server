const { handler } = require('../netlify/functions/scores');
const { v4: uuidv4 } = require("uuid");

// Mock Supabase client
const mockSelect = jest.fn();
const mockUpsert = jest.fn();
const mockSingle = jest.fn();

const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockImplementation(() => {
    mockSelect();
    return {
      single: mockSingle
    };
  }),
  upsert: jest.fn().mockImplementation(() => {
    mockUpsert();
    return {
      select: jest.fn().mockReturnThis(),
      single: mockSingle
    };
  }),
  auth: {
    getUser: jest.fn().mockResolvedValue({
      data: { user: { id: "1" } },
      error: null,
    }),
  },
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabase),
}));

// Mock CORS headers
jest.mock("../utils/CORS_HEADERS", () => ({
  CORS_HEADERS: () => ({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, userId",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  }),
}));

describe("Scores API", () => {
  const userId = "1";
  const mockScore = {
    criteria_id: uuidv4(),
    choice_id: uuidv4(),
    score: 4,
    userId: "1",
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Set environment variables
    process.env.SUPABASE_URL = "https://test.supabase.co";
    process.env.SUPABASE_ANON_KEY = "test-key";

    // Set up default mock responses
    mockSingle.mockResolvedValue({ data: mockScore, error: null });
    mockUpsert.mockReturnValue({ data: mockScore, error: null });
  });

  it("PUT /scores should create or update a score", async () => {
    const event = {
      httpMethod: "PUT",
      headers: {
        cookie: "sb-auth-token=mock-token",
      },
      body: JSON.stringify(mockScore),
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual(mockScore);
    expect(mockSupabase.from).toHaveBeenCalledWith("scores");
    expect(mockUpsert).toHaveBeenCalled();
    expect(mockSupabase.upsert).toHaveBeenCalledWith(
      {
        criteria_id: mockScore.criteria_id,
        choice_id: mockScore.choice_id,
        score: mockScore.score,
        created_by: mockScore.userId,
      },
      { onConflict: "criteria_id,choice_id" }
    );
  });

    it("PUT /scores should return 401 if no userId provided", async () => {
      const event = {
          httpMethod: "PUT",
          headers: {
              // userId: userId, // Missing userId and headers
              cookie: "", // Empty cookie
          },
          body: JSON.stringify(mockScore),
      };
      const response = await handler(event);
      expect(response.statusCode).toBe(401);
      expect(JSON.parse(response.body).error).toEqual("Unauthorized");
    });

  it("PUT /scores should return an error if criteria_id is missing", async () => {
    const event = {
      httpMethod: "PUT",
      headers: {
        cookie: "sb-auth-token=mock-token",
      },
      body: JSON.stringify({
        choice_id: "1",
        score: 4,
        userId: "1",
      }),
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body).error).toBe("Invalid request body: criteria_id, choice_id, and score are required");
  });

  it("PUT /scores should return an error if choice_id is missing", async () => {
    const event = {
      httpMethod: "PUT",
      headers: {
        cookie: "sb-auth-token=mock-token",
      },
      body: JSON.stringify({
        criteria_id: "1",
        score: 4,
        userId: "1",
      }),
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body).error).toBe("Invalid request body: criteria_id, choice_id, and score are required");
  });

  it("PUT /scores should return an error if score is missing", async () => {
    const event = {
      httpMethod: "PUT",
      headers: {
        cookie: "sb-auth-token=mock-token",
      },
      body: JSON.stringify({
        criteria_id: "1",
        choice_id: "1",
        userId: "1",
      }),
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body).error).toBe("Invalid request body: criteria_id, choice_id, and score are required");
  });

  it("PUT /scores should return an error if score is invalid", async () => {
    const event = {
      httpMethod: "PUT",
      headers: {
        cookie: "sb-auth-token=mock-token",
      },
      body: JSON.stringify({
        criteria_id: "1",
        choice_id: "1",
        score: 6,
        userId: "1",
      }),
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body).error).toBe("Invalid score: Score must be between 0 and 5");
  });
});
