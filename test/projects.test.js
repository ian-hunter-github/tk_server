const { handler } = require("../netlify/functions/projects");
const supabase = require("@supabase/supabase-js");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

// Mock CORS headers
jest.mock("../utils/CORS_HEADERS", () => ({
  CORS_HEADERS: () => ({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, userId",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  }),
}));

describe("Projects API", () => {
  const userId = uuidv4();
  const projectId_1 = uuidv4();
  const projectId_2 = uuidv4();
  const mockProjects = [
    { id: projectId_1, title: "Project 1", created_by: userId },
    { id: projectId_2, title: "Project 2", created_by: userId },
  ];
  const mockProject = {
    id: projectId_2,
    title: "Project 1",
    created_by: userId,
    criteria: [], // Add empty criteria array
    choices: []   // Add empty choices array
  };
  let authToken;

  beforeAll(async () => {
    const testToken = jwt.sign(
      { sub: userId, email: "ian@tests.com" },
      process.env.SUPABASE_JWT_SECRET
    );
    // Use the global mock's signInWithPassword
    const mockSignInResponse = {
      data: {
        user: {
          id: userId,
          email: "ian@tests.com",
        },
        session: {
          access_token: testToken,
          expires_in: 3600,
        },
      },
      error: null,
    };
    supabase.createClient().auth.signInWithPassword.mockResolvedValue(mockSignInResponse)
    authToken = testToken;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Use the global mock's getUser
    supabase.createClient().auth.getUser.mockImplementation((token) => {
      if (token === authToken) {
        return Promise.resolve({ data: { user: { id: userId } }, error: null });
      } else {
        return Promise.resolve({
          data: { user: null },
          error: { message: "Invalid token" },
        });
      }
    });
  });

  it("GET /projects should return all projects for the user", async () => {
    // Set up the mock response for this specific test
    supabase.createClient().from().mockResolvedValue({ data: mockProjects, error: null });

    const event = {
      path: "/projects",
      httpMethod: "GET",
      headers: {
        cookie: `sb-auth-token=${authToken}`,
      },
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    const actualProjects = JSON.parse(response.body);
    expect(actualProjects).toEqual(mockProjects);
  });

    it("GET /projects should return an error if the database query fails", async () => {
    supabase.createClient().from().mockResolvedValue({ data: null, error: { message: "db error" } });

    const event = {
      path: "/projects",
      httpMethod: "GET",
      headers: {
        cookie: `sb-auth-token=${authToken}`,
      },
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(500);
  });

  it("GET /projects should return 401 if no cookie provided", async () => {
    const event = {
      path: "/projects",
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
      supabase.createClient().from().mockResolvedValue({ data: null, error: { message: "error" } });

    const event = {
      path: "/projects",
      httpMethod: "POST",
      headers: {
        cookie: `sb-auth-token=${authToken}`,
      },
      body: JSON.stringify({
        description: "Test Description",
      }),
    };
    const response = await handler(event);
    expect(response.statusCode).toBe(500);
  });

  it("POST /projects should create a project", async () => {
    supabase.createClient().from().mockResolvedValue({ data: mockProject, error: null });

    const event = {
      path: "/projects",
      httpMethod: "POST",
      headers: {
        cookie: `sb-auth-token=${authToken}`,
      },
      body: JSON.stringify({
        title: "Project 3",
        description: "Description",
      }),
    };
    const response = await handler(event);
    expect(response.statusCode).toBe(201);
    const actualProject = JSON.parse(response.body);
    expect(actualProject).toEqual(mockProject);
  });

it("GET /projects/:id should return a single project", async () => {
  const projectId = uuidv4(); // Generate a mock project ID

  // Mock the entire projects module locally *within* the test case
  jest.doMock("../netlify/functions/projects", () => ({
    ...jest.requireActual("../netlify/functions/projects"), // Use actual implementation for other functions
    fetchCriteria: jest.fn().mockResolvedValue([]), // Mock fetchCriteria
    fetchChoices: jest.fn().mockResolvedValue([]),  // Mock fetchChoices
  }));

  // *Re-import* the handler function *after* mocking
  const { handler } = require("../netlify/functions/projects");

    // Mock the specific chained call for fetching a single project
    supabase.createClient().from('projects').select('*').eq('id', projectId).eq('created_by', userId).single.mockResolvedValue({
      data: { ...mockProject, id: projectId },
      error: null,
    });

  // Mock the Supabase calls within fetchCriteria and fetchChoices
    supabase.createClient().from('criteria').select('*').eq('project_id', projectId).eq('created_by', userId).mockResolvedValue({
      data: [],
      error: null
    });

    supabase.createClient().from('choices').select('*').eq('project_id', projectId).eq('created_by', userId).mockResolvedValue({
      data: [],
      error: null
    });

  // Mock the Supabase calls for scores within fetchProjects
    supabase.createClient().from('scores').select('*').in = jest.fn().mockReturnThis(); // Mock .in() to allow chaining
    supabase.createClient().from('scores').select('*').in.mockResolvedValue({ data: [], error: null });

  const event = {
    path: `/projects/${projectId}`,
    httpMethod: "GET",
    headers: {
      cookie: `sb-auth-token=${authToken}`,
    },
    pathParameters: {
      id: projectId, // Use the generated ID
    },
  };
  const response = await handler(event);
  expect(response.statusCode).toBe(200);
  const actualProject = JSON.parse(response.body);
  expect(actualProject).toEqual({ ...mockProject, id: projectId, criteria: [], choices: [] }); //Match the expected return
});

 it("PUT /projects/:id should update a project", async () => {
    const projectId = uuidv4(); // Generate a mock project ID

    // Mock the specific chained call for updating a project
    supabase.createClient().from('projects').update().eq('id', projectId).eq('created_by', userId).single.mockResolvedValue({
      data: { ...mockProject, id: projectId }, // Return the updated project
      error: null,
    });

    const event = {
      path: `/projects/${projectId}`,
      httpMethod: "PUT",
      headers: {
        cookie: `sb-auth-token=${authToken}`,
      },
      pathParameters: {
        id: projectId, // Use the generated ID
      },
      body: JSON.stringify({
        title: "Project 1 Updated",
        description: "Updated Description",
      }),
    };
    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    const actualProject = JSON.parse(response.body);
    expect(actualProject).toEqual({ ...mockProject, id: projectId, criteria: [], choices: [] }); // Match the expected return
  });

  it("DELETE /projects/:id should delete a project", async () => {
    supabase.createClient().from().mockResolvedValue({ data: null, error: null });

    const event = {
      path: `/projects/${projectId_1}`,
      httpMethod: "DELETE",
      headers: {
        cookie: `sb-auth-token=${authToken}`,
      },
      pathParameters: {
        id: `${projectId_1}`,
      },
    };
    const response = await handler(event);
    expect(response.statusCode).toBe(200);
  });
});
