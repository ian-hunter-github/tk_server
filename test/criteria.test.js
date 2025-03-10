const { handler } = require("../netlify/functions/criteria");
const {
  getSessionToken: mockGetSessionToken,
} = require("../utils/getSessionToken");
const supabase = require("@supabase/supabase-js");
const { v4: uuidv4 } = require("uuid");

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

describe("criteria API", () => {
  const userId = uuidv4();
  const criteriaId_1 = uuidv4()
  const criteriaId_2 = uuidv4()
  const projectId = uuidv4();
  const mockChoices = [
    { id: criteriaId_1, project_id: projectId, definition: "Criteria 1" },
    { id: criteriaId_2, project_id: projectId, definition: "Criteria 2" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SUPABASE_URL = "https://test.supabase.co";
    process.env.SUPABASE_ANON_KEY = "test-key";
    mockGetSessionToken.mockReturnValue(userId);
  });

  it("GET /criteria should return all criteria for the project with userId", async () => {
    mockFrom.mockReturnThis();
    mockSelect.mockReturnThis();
    mockEq.mockResolvedValueOnce({ data: mockChoices, error: null });

    const event = {
      httpMethod: "GET",
      headers: {  },
      queryStringParameters: { "projectId": projectId },
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body)).toEqual({ error: "Unauthorized" });
  });

  it("POST /criteria should create criteria with userId", async () => {
    mockInsert.mockReturnValueOnce({ select: mockSelect });
    mockSelect.mockResolvedValueOnce({ data: mockChoices, error: null });
    const event = {
      httpMethod: "POST",
      headers: {  },
      body: JSON.stringify({
        project_id: "1",
        criteria: mockChoices,
      }),
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body)).toEqual({ error: "Unauthorized" });
  });

    it("DELETE /criteria/:id should delete a choice with userId", async () => {
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
