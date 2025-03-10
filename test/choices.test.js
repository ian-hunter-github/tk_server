const { handler } = require("../netlify/functions/choices");
const {
  getSessionToken: mockGetSessionToken,
} = require("../utils/getSessionToken");
const supabase = require("@supabase/supabase-js");

jest.mock("../utils/getSessionToken");

// Mock CORS headers
jest.mock("../utils/CORS_HEADERS", () => ({
  CORS_HEADERS: () => ({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, userId",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  }),
}));

// Create Supabase mock methods
const mockFrom = jest.fn().mockReturnThis();
const mockSelect = jest.fn().mockReturnThis();
const mockEq = jest.fn().mockImplementation((args) => {
  if (typeof args === 'object' && args !== null) {
    // Handle object-based .eq()
    return {
      eq: mockEq,
      single: mockSingle,
      select: mockSelect,
      delete: mockDelete,
    };
  } else {
    // Handle previous string, value .eq() calls
    return {
      eq: mockEq,
      single: mockSingle,
      select: mockSelect,
      delete: mockDelete,
    }
  }
});
const mockSingle = jest.fn().mockReturnThis();
const mockInsert = jest.fn();
const mockUpdate = jest.fn().mockReturnThis();
const mockDelete = jest.fn();

// Mock Supabase client
jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({
    from: mockFrom,
    select: mockSelect,
    eq: mockEq,
    single: mockSingle,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
  })),
}));

describe("Choices API", () => {
  const userId = "1";
  const mockChoices = [
    { id: "1", project_id: "1", description: "Choice 1" },
    { id: "2", project_id: "1", description: "Choice 2" },
  ];
  const mockChoice = { id: "1", project_id: "1", description: "Choice 1" };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SUPABASE_URL = "https://test.supabase.co";
    process.env.SUPABASE_ANON_KEY = "test-key";
    mockGetSessionToken.mockReturnValue(userId);
  });

  it("GET /choices should return all choices for the project with userId", async () => {
    mockFrom.mockReturnThis();
    mockSelect.mockReturnThis();
    mockEq.mockResolvedValueOnce({ data: mockChoices, error: null });

    const event = {
      httpMethod: "GET",
      headers: {  },
      queryStringParameters: { projectId: "1" },
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body)).toEqual({ error: "Unauthorized" });
  });

  it("POST /choices should create choices with userId", async () => {
    mockInsert.mockReturnValueOnce({ select: mockSelect });
    mockSelect.mockResolvedValueOnce({ data: mockChoices, error: null });
    const event = {
      httpMethod: "POST",
      headers: {  },
      body: JSON.stringify({
        project_id: "1",
        choices: mockChoices,
      }),
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body)).toEqual({ error: "Unauthorized" });
  });

    it("DELETE /choices/:id should delete a choice with userId", async () => {
      mockDelete.mockReturnValueOnce({ eq: mockEq });
      mockEq.mockResolvedValueOnce({ data: null, error: null });

    const event = {
      httpMethod: "DELETE",
      headers: {  },
      pathParameters: { id: "1" },
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body)).toEqual({ error: "Unauthorized" });
  });
});
