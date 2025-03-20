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
    {
      id: projectId_1,
      title: "Project 1",
      created_by: userId,
      criteria: [
        { id: uuidv4(), definition: "Criterion 1", weight: 5 },
        { id: uuidv4(), definition: "Criterion 2", weight: 3 },
      ],
      choices: [
        { id: uuidv4(), description: "Choice 1", disqualified: false },
        { id: uuidv4(), description: "Choice 2", disqualified: true },
      ],
    },
    {
      id: projectId_2,
      title: "Project 2",
      created_by: userId,
      criteria: [],
      choices: [],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    process.env.SUPABASE_URL = "https://test.supabase.co";
    process.env.SUPABASE_ANON_KEY = "test_anon_key";

    mockDb = {
      signIn: jest.fn().mockResolvedValue({ data: { user: { id: userId } } }),
      fetchAllProjects: jest
        .fn()
        .mockResolvedValue({ data: mockProjects, error: null }),
      fetchProjectById: jest
        .fn()
        .mockResolvedValue({ data: mockProjects[0], error: null }),
      createProject: jest
        .fn()
        .mockResolvedValue({ data: mockProjects[0], error: null }),
      updateProject: jest
        .fn()
        .mockResolvedValue({ data: mockProjects[0], error: null }),
      deleteProject: jest.fn().mockResolvedValue({ data: null, error: null }),
      //fetchCriteria: jest.fn().mockResolvedValue({ data: [], error: null }),
      //fetchChoices: jest.fn().mockResolvedValue({ data: [], error: null }),
      //fetchScores: jest.fn().mockResolvedValue({ data: [], error: null }),
      getUser: jest.fn(),
    };
    getDatabaseInstance.mockReturnValue(mockDb);
  });

  it("GET /projects should return all projects with criteria, choices, and scores for the user", async () => {
    mockDb.getUser.mockResolvedValue({ data: { user: { id: userId } } });
    mockDb.fetchAllProjects.mockResolvedValue({
      data: [
        {
          id: projectId_1,
          title: "Project 1",
          created_by: userId,
          criteria: [
            {
              id: "criteria-1",
              definition: "Criterion 1",
              weight: 5,
              scores: [{ choice_id: "choice-1", score: 3 }],
            },
            {
              id: "criteria-2",
              definition: "Criterion 2",
              weight: 3,
              scores: [{ choice_id: "choice-1", score: 2 }],
            },
          ],
          choices: [
            {
              id: "choice-1",
              description: "Choice 1",
              disqualified: false,
              scores: [
                { criteria_id: "criteria-1", score: 3 },
                { criteria_id: "criteria-2", score: 2 },
              ],
            },
          ],
        },
      ],
      error: null,
    });

    const event = {
      httpMethod: "GET",
      headers: { cookie: `sb-auth-token=${userId}` },
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(200);

    const responseBody = JSON.parse(response.body);
    expect(responseBody[0].choices[0].total_score).toBe(21); // (3 * 5) + (2 * 3)
    expect(mockDb.fetchAllProjects).toHaveBeenCalledWith(userId);

  });

  it("GET /projects/:id should return a single project with criteria, choices, and scores", async () => {
    // Mock the database response for fetchProjectById
    mockDb.fetchProjectById.mockResolvedValue({
      data: {
        id: projectId_1,
        title: "Project 1",
        created_by: userId,
        criteria: [
          {
            id: "criteria-1",
            definition: "Criterion 1",
            weight: 5,
            scores: [{ choice_id: "choice-1", score: 3 }],
          },
          {
            id: "criteria-2",
            definition: "Criterion 2",
            weight: 3,
            scores: [{ choice_id: "choice-1", score: 2 }],
          },
        ],
        choices: [
          {
            id: "choice-1",
            description: "Choice 1",
            disqualified: false,
            scores: [
              { criteria_id: "criteria-1", score: 3 },
              { criteria_id: "criteria-2", score: 2 },
            ],
          },
        ],
      },
      error: null,
    });
  
    // Mock the user authentication
    mockDb.getUser.mockResolvedValue({ data: { user: { id: userId } } });
  
    // Simulate the API request
    const event = {
      httpMethod: "GET",
      headers: { cookie: `sb-auth-token=${userId}` },
      pathParameters: { id: projectId_1 },
    };
  
    const response = await handler(event);
  
    // Verify the response
    expect(response.statusCode).toBe(200);
  
    const responseBody = JSON.parse(response.body);
  
    // Verify the structure of the returned project
    expect(responseBody).toEqual({
      id: projectId_1,
      title: "Project 1",
      created_by: userId,
      criteria: [
        {
          id: "criteria-1",
          definition: "Criterion 1",
          weight: 5,
          scores: [{ choice_id: "choice-1", score: 3 }],
        },
        {
          id: "criteria-2",
          definition: "Criterion 2",
          weight: 3,
          scores: [{ choice_id: "choice-1", score: 2 }],
        },
      ],
      choices: [
        {
          id: "choice-1",
          description: "Choice 1",
          disqualified: false,
          scores: {
            "criteria-1": 3,
            "criteria-2": 2,
          },
          total_score: 21, // (3 * 5) + (2 * 3)
        },
      ],
    });
  
    // Verify that the database method was called with the correct arguments
    expect(mockDb.fetchProjectById).toHaveBeenCalledWith(userId, projectId_1);
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
    expect(JSON.parse(response.body).error).toEqual("db error");
  });

  it("GET /projects/:id should return an error if the project is not found", async () => {
    mockDb.getUser.mockResolvedValue({ data: { user: { id: userId } } });
    mockDb.fetchProjectById.mockResolvedValue({
      data: null,
      error: { message: "not found" },
    });

    const event = {
      httpMethod: "GET",
      headers: { cookie: `sb-auth-token=${userId}` },
      pathParameters: { id: uuidv4() },
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(404);
    expect(JSON.parse(response.body).error).toEqual("not found");
  });
});
