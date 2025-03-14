const { handler } = require("../netlify/functions/projects");
const { getDatabaseInstance } = require("../utils/dbFactory.js");
const { v4: uuidv4 } = require("uuid");

// Mock dbFactory
jest.mock("../utils/dbFactory.js");

// Mock CORS headers
jest.mock("../utils/CORS_HEADERS", () => ({
  CORS_HEADERS: () => ({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, userId",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  }),
}));

describe("Projects API", () => {
  let mockDb;
  const userId = uuidv4();
  const projectId_1 = uuidv4();
    const projectId_2 = uuidv4();
    const mockProjects = [
        { id: projectId_1, title: "Project 1", created_by: userId, criteria: [], choices: [] },
        { id: projectId_2, title: "Project 2", created_by: userId, criteria: [], choices: [] },
    ];
    const mockProject = {
        id: projectId_2, // Use a predefined ID
        title: "Project 1",
        created_by: userId,
        criteria: [],
        choices: [],
    };

    beforeEach(() => {
        jest.clearAllMocks();

        process.env.SUPABASE_URL="https://test.supabase.co"
        process.env.SUPABASE_ANON_KEY="test_anon_key"

        mockDb = {
            signIn: jest.fn().mockResolvedValue({ data: { user: { id: userId } } }),
            fetchAllProjects: jest.fn().mockResolvedValue({ data: mockProjects, error: null }),
            fetchProjectById: jest.fn().mockResolvedValue({ data: mockProject, error: null }),
            createProject: jest
                .fn()
                .mockResolvedValue({ data: mockProject, error: null }),
            updateProject: jest
                .fn()
                .mockResolvedValue({ data: mockProject, error: null }),
            deleteProject: jest.fn().mockResolvedValue({ data: null, error: null }),
            fetchCriteria: jest.fn().mockResolvedValue({ data: [], error: null }),
            fetchChoices: jest.fn().mockResolvedValue({ data: [], error: null }),
            fetchScores: jest.fn().mockResolvedValue({ data: [], error: null }),
            getUser: jest.fn(),
        };
        getDatabaseInstance.mockReturnValue(mockDb);
    });

    it("GET /projects should return all projects for the user", async () => {
      mockDb.getUser.mockResolvedValue({ data: { user: { id: userId } } });
        const event = {
            httpMethod: "GET",
            headers: { cookie: `sb-auth-token=${userId}` },
        };

        const response = await handler(event);
        expect(response.statusCode).toBe(200);
        expect(JSON.parse(response.body)).toEqual(mockProjects);
        expect(mockDb.fetchAllProjects).toHaveBeenCalledWith(userId);
    });

    it("GET /projects should return an error if the database query fails", async () => {
      mockDb.getUser.mockResolvedValue({ data: { user: { id: userId } } });
        mockDb.fetchAllProjects.mockResolvedValue({
            data: null,
            error: { message: "db error" },
        });
        const event = {
            httpMethod: "GET",
            headers: { cookie: `sb-auth-token=${userId}` },
        };

        const response = await handler(event);
        expect(response.statusCode).toBe(500);
    });

  it("GET /projects should return 401 if no cookie provided", async () => {
      mockDb.getUser.mockRejectedValue(new Error('Unauthorized'));
        const event = {
            httpMethod: "GET",
            headers: {},
        };
        const response = await handler(event);
        expect(response.statusCode).toBe(401);
      expect(JSON.parse(response.body).error).toEqual(
        "Unauthorized: No token provided"
      );
    });

    it("POST /projects should return an error if title is missing", async () => {
      mockDb.getUser.mockResolvedValue({ data: { user: { id: userId } } });
        const event = {
            httpMethod: "POST",
            headers: { cookie: `sb-auth-token=${userId}` },
            body: JSON.stringify({
                description: "Test Description",
            }),
        };
        const response = await handler(event);
        expect(response.statusCode).toBe(400);
    });

    it("POST /projects should create a project", async () => {
      mockDb.getUser.mockResolvedValue({ data: { user: { id: userId } } });
        const event = {
            httpMethod: "POST",
            headers: { cookie: `sb-auth-token=${userId}` },
            body: JSON.stringify({
                title: "Project 3",
                description: "Description",
            }),
        };
        const response = await handler(event);
        expect(response.statusCode).toBe(201);
        expect(JSON.parse(response.body)).toEqual(mockProject);
        expect(mockDb.createProject).toHaveBeenCalledWith(userId, {
            title: "Project 3",
            description: "Description",
        });
    });

    it("GET /projects/:id should return a single project", async () => {
      mockDb.getUser.mockResolvedValue({ data: { user: { id: userId } } });
        const projectId = uuidv4();
        const mockProjectWithId = {
            ...mockProject,
            id: projectId,
            criteria: [],
            choices: [],
        };

        // Mock fetchProjectById to simulate fetching a single project
        mockDb.fetchProjectById.mockImplementation(async (userId, pId) => {
            if (pId === projectId) {
                return { data: mockProjectWithId, error: null };
            }
            return { data: null, error: { message: 'not found' } }
        });


        const event = {
            httpMethod: "GET",
            headers: { cookie: `sb-auth-token=${userId}` },
            pathParameters: { id: projectId },
        };
        const response = await handler(event);
        expect(response.statusCode).toBe(200);
        expect(JSON.parse(response.body)).toEqual(mockProjectWithId);
        expect(mockDb.fetchProjectById).toHaveBeenCalledWith(userId, projectId);
    });

    it("PUT /projects/:id should update a project", async () => {
      mockDb.getUser.mockResolvedValue({ data: { user: { id: userId } } });
        const projectId = uuidv4();
        mockDb.updateProject.mockResolvedValue({
            data: { ...mockProject, id: projectId },
            error: null,
        });

        const event = {
            httpMethod: "PUT",
            headers: { cookie: `sb-auth-token=${userId}` },
            pathParameters: { id: projectId },
            body: JSON.stringify({
                title: "Project 1 Updated",
                description: "Updated Description",
            }),
        };
        const response = await handler(event);
        expect(response.statusCode).toBe(200);
        expect(JSON.parse(response.body)).toEqual({
            ...mockProject,
            id: projectId,
        });
        expect(mockDb.updateProject).toHaveBeenCalledWith(userId, projectId, {
            title: "Project 1 Updated",
            description: "Updated Description",
        });
    });

    it("DELETE /projects/:id should delete a project", async () => {
      mockDb.getUser.mockResolvedValue({ data: { user: { id: userId } } });
        const event = {
            httpMethod: "DELETE",
            headers: { cookie: `sb-auth-token=${userId}` },
            pathParameters: { id: projectId_1 },
        };
        const response = await handler(event);
        expect(response.statusCode).toBe(200);
        expect(JSON.parse(response.body)).toEqual({
            message: "Project deleted successfully",
        });
        expect(mockDb.deleteProject).toHaveBeenCalledWith(userId, projectId_1);
    });
});
