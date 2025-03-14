const { handler } = require("../netlify/functions/criteria");
const { v4: uuidv4 } = require("uuid");
const { getDatabaseInstance } = require('../utils/dbFactory');

// Mock the DatasourceInterface
jest.mock('../utils/dbFactory', () => ({
    getDatabaseInstance: jest.fn(),
}));

describe("criteria API", () => {
    const userId = uuidv4();
    const criteriaId_1 = uuidv4();
    const criteriaId_2 = uuidv4();
    const projectId = uuidv4();
    const mockCriteria = [
        { id: criteriaId_1, project_id: projectId, name: "Criteria 1" },
        { id: criteriaId_2, project_id: projectId, name: "Criteria 2" },
    ];

    let mockDb;

    beforeEach(() => {
        jest.clearAllMocks();

        mockDb = {
            signIn: jest.fn().mockResolvedValue({ data: { user: { id: userId } } }),
            fetchCriteria: jest.fn().mockResolvedValue({ data: mockCriteria, error: null }),
            createCriteria: jest.fn().mockResolvedValue({ data: mockCriteria, error: null }),
            fetchChoices: jest.fn().mockResolvedValue({data: [], error: null}),
            // updateProject: jest.fn().mockResolvedValue({ data: mockCriteria[0], error: null }), // Not implemented yet
            // deleteProject: jest.fn().mockResolvedValue({ data: null, error: null }), // Not implemented yet
            getUser: jest.fn().mockResolvedValue({ data: { user: { id: userId } } }),
        };
        getDatabaseInstance.mockReturnValue(mockDb);
    });

    it("GET /criteria should return all criteria for the project with userId", async () => {
        const event = {
            httpMethod: "GET",
            headers: { cookie: `sb-auth-token=${userId}` },
            queryStringParameters: { projectId: projectId },
        };

        const response = await handler(event);
        expect(response.statusCode).toBe(200);
        expect(JSON.parse(response.body)).toEqual(mockCriteria);
        expect(mockDb.fetchCriteria).toHaveBeenCalledWith(userId, projectId);
    });

    it("GET /criteria should return 401 if not authorized", async () => {
        const event = {
            httpMethod: "GET",
            headers: { },
            queryStringParameters: { projectId: projectId },
        };
        mockDb.signIn.mockResolvedValue({data: {}, error: 'No token'});
        const response = await handler(event);
        expect(response.statusCode).toBe(401);
    });

  it("POST /criteria should create criteria with userId", async () => {
    const event = {
      httpMethod: "POST",
      headers: { cookie: `sb-auth-token=${userId}` },
      body: JSON.stringify({
        project_id: projectId,
        criteria: mockCriteria,
      }),
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(201);
    expect(JSON.parse(response.body)).toEqual(mockCriteria);
    expect(mockDb.createCriteria).toHaveBeenCalledWith(userId, projectId, mockCriteria);
  });

    it("POST /criteria should return 401 if not authorized", async () => {
        const event = {
            httpMethod: "POST",
            headers: {  },
            body: JSON.stringify({
                project_id: projectId,
                criteria: mockCriteria,
            }),
        };
        mockDb.signIn.mockResolvedValue({data: {}, error: 'No token'});
        const response = await handler(event);
        expect(response.statusCode).toBe(401);
    });

  it("DELETE /criteria/:id should delete a choice with userId", async () => {
    const event = {
      httpMethod: "DELETE",
      headers: { cookie: `sb-auth-token=${userId}` },
      pathParameters: { id: criteriaId_1 },
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ message: "Criterion deleted successfully" });
  });

});
