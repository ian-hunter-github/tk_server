const { handler } = require("../netlify/functions/choices");
const { v4: uuidv4 } = require("uuid");
const { getDatabaseInstance } = require("../utils/dbFactory");

// Mock the DatasourceInterface
jest.mock("../utils/dbFactory", () => ({
  getDatabaseInstance: jest.fn(),
}));

describe("Choices API", () => {
  const userId = uuidv4();
  const choiceId_1 = uuidv4();
  const choiceId_2 = uuidv4();
  const projectId = uuidv4();
  const mockChoices = [
    { id: choiceId_1, project_id: projectId, name: "Choice 1" },
    { id: choiceId_2, project_id: projectId, name: "Choice 2" },
  ];

  let mockDb;

  beforeEach(() => {
    jest.clearAllMocks();

    mockDb = {
      signIn: jest.fn().mockResolvedValue({ data: { user: { id: userId } } }),
      fetchChoices: jest
        .fn()
        .mockResolvedValue({ data: mockChoices, error: null }),
      createChoices: jest
        .fn()
        .mockResolvedValue({ data: mockChoices, error: null }),
      fetchCriteria: jest.fn().mockResolvedValue({ data: [], error: null }),
      updateChoice: jest
        .fn()
        .mockResolvedValue({ data: mockChoices[0], error: null }),
      deleteChoice: jest.fn().mockResolvedValue({ data: null, error: null }),
    };
    getDatabaseInstance.mockReturnValue(mockDb);
  });

  it("GET /choices should return all choices for the project with userId", async () => {
    const event = {
      httpMethod: "GET",
      headers: { cookie: `sb-auth-token=${userId}` },
      queryStringParameters: { projectId: projectId },
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual(mockChoices);
    expect(mockDb.signIn).toHaveBeenCalledWith(null, null, userId);
    expect(mockDb.fetchChoices).toHaveBeenCalledWith(userId, projectId);
  });

  it("GET /choices should return 401 if not authorized", async () => {
    const event = {
      httpMethod: "GET",
      headers: {},
      queryStringParameters: { projectId: projectId },
    };
    mockDb.signIn.mockResolvedValue({ data: {}, error: "No token" });
    const response = await handler(event);
    expect(response.statusCode).toBe(401);
  });

  it("POST /choices should create a choice with userId", async () => {
    const event = {
      httpMethod: "POST",
      headers: { cookie: `sb-auth-token=${userId}` },
      body: JSON.stringify({
        project_id: projectId,
        choices: mockChoices,
      }),
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(201);
    expect(JSON.parse(response.body)).toEqual(mockChoices);
    expect(mockDb.signIn).toHaveBeenCalledWith(null, null, userId);
    expect(mockDb.createChoices).toHaveBeenCalledWith(
      userId,
      projectId,
      mockChoices
    );
  });

  it("POST /choices should return 401 if not authorized", async () => {
    const event = {
      httpMethod: "POST",
      headers: {},
      body: JSON.stringify({
        project_id: projectId,
        choices: mockChoices,
      }),
    };
    mockDb.signIn.mockResolvedValue({ data: {}, error: "No token" });
    const response = await handler(event);
    expect(response.statusCode).toBe(401);
  });

  it("PUT /choices/:id should update a choice with userId", async () => {
    const event = {
      httpMethod: "PUT",
      headers: { cookie: `sb-auth-token=${userId}` },
      pathParameters: { id: choiceId_1 },
      body: JSON.stringify({
        name: "Updated Choice",
      }),
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    expect(mockDb.signIn).toHaveBeenCalledWith(null, null, userId);
    expect(mockDb.updateChoice).toHaveBeenCalledWith(userId, choiceId_1, {
      name: "Updated Choice",
    });
  });

  it("DELETE /choices/:id should delete a choice with userId", async () => {
    const event = {
      httpMethod: "DELETE",
      headers: { cookie: `sb-auth-token=${userId}` },
      pathParameters: { id: choiceId_1 },
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({
      message: "Choice deleted successfully",
    });
    expect(mockDb.signIn).toHaveBeenCalledWith(null, null, userId);
    expect(mockDb.deleteChoice).toHaveBeenCalledWith(userId, choiceId_1);
  });
});
