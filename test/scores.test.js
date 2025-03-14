const { handler } = require("../netlify/functions/scores");
const { v4: uuidv4 } = require("uuid");
const { getDatabaseInstance } = require('../utils/dbFactory');

// Mock the DatasourceInterface
jest.mock('../utils/dbFactory', () => ({
  getDatabaseInstance: jest.fn(),
}));

describe("Scores API", () => {
  const userId = "1";
  const mockScore = {
    criteria_id: uuidv4(),
    choice_id: uuidv4(),
    score: 4,
    created_by: userId,
  };

  let mockDb;

  beforeEach(() => {
    jest.clearAllMocks();

    mockDb = {
        signIn: jest.fn().mockResolvedValue({ data: { user: { id: userId } } }),
        updateScore: jest.fn().mockResolvedValue({ data: mockScore, error: null }),
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: userId } } }),
    };
    getDatabaseInstance.mockReturnValue(mockDb);
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
    expect(mockDb.updateScore).toHaveBeenCalledWith(userId, mockScore.criteria_id, mockScore.choice_id, mockScore.score);
    
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
        created_by: "1",
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
        created_by: "1",
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
        created_by: "1",
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
        created_by: "1",
      }),
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body).error).toBe("Invalid score: Score must be between 0 and 5");
  });
});
