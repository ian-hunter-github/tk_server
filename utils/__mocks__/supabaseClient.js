const { v4: uuidv4 } = require("uuid");

const mockUser = {
  id: "test-user-id",
  email: "testXXX@example.com",
};

const mockSession = {
  access_token: "test-access-token",
  refresh_token: "test-refresh-token",
  expires_in: 3600,
  user: mockUser,
};

const mockProjectId1 = uuidv4();
const mockProjectId2 = uuidv4();

const mockProjects = [
  {
    id: mockProjectId1,
    created_by: mockUser.id,
    title: "Mock Project 1",
  },
  {
    id: mockProjectId2,
    created_by: mockUser.id,
    title: "Mock Project 2",
  },
];

const mockCriteria = [
  {
    id: uuidv4(),
    project_id: mockProjectId1,
    created_by: mockUser.id,
    weight: 1,
    title: "Criteria 1",
  },
  {
    id: uuidv4(),
    project_id: mockProjectId2,
    created_by: mockUser.id,
    weight: 2,
    title: "Criteria 2",
  },
];

const mockChoices = [
  {
    id: uuidv4(),
    project_id: mockProjectId1,
    created_by: mockUser.id,
    title: "Choice 1",
  },
  {
    id: uuidv4(),
    project_id: mockProjectId2,
    created_by: mockUser.id,
    title: "Choice 2",
  },
];

const mockScores = [
  {
    id: uuidv4(),
    choice_id: mockChoices[0].id,
    criteria_id: mockCriteria[0].id,
    score: 5,
  },
];

// Mock Supabase query builder
const createMockQueryBuilder = (initialData) => {
  console.log("createMockQueryBuilder called with initialData:", initialData);
  let queryData = initialData;
  let isSingle = false;

  const applyFilters = (filters) => {
    console.log("applyFilters called with filters:", filters);
    let filteredData = [...queryData]; // Work on a copy
    for (const key in filters) {
      const [field, value] = filters[key];
      if (Array.isArray(value)) {
        // Handle 'in' filter
        filteredData = filteredData.filter((item) => value.includes(item[field]));
      } else {
        // Handle 'eq' filter
        filteredData = filteredData.filter((item) => item[field] === value);
      }
    }
    console.log("applyFilters returning filteredData:", filteredData);
    return filteredData;
  };

  const builder = {
    select: jest.fn().mockImplementation(() => {
      return builder;
    }),
    eq: jest.fn().mockImplementation((column, value) => {
      // Accumulate filters within this query builder instance
      console.log(`eq called with column: ${column}, value: ${value}`);
      builder.filters[column] = [column, value];
      return builder;
    }),
    in: jest.fn().mockImplementation((column, values) => {
      console.log(`in called with column: ${column}, values:`, values);
      builder.filters[column] = [column, values];
      return builder;
    }),
    single: jest.fn().mockImplementation(() => {
      console.log("single called");
      isSingle = true;
      return builder;
    }),
    then: jest.fn().mockImplementation((resolve) => {
      const filteredData = applyFilters(builder.filters);
      let result;
      if (isSingle) {
        result = filteredData.length > 0 ? filteredData[0] : null;
        // If single() is called, Supabase client returns { data: null, error: null } when no data is found
        result = result === null ? { data: null, error: null } : { data: result, error: null };
      } else {
        result = { data: filteredData, error: null };
      }
      console.log("then returning result:", result);
      resolve(result);
      return builder;
    }),
  };
  // Initialize filters for each query builder instance
  builder.filters = {};
  return builder;
};

const mockSupabaseClient = {
  auth: {
    signInWithPassword: jest.fn(async ({ email, password }) => {
      if (email === "ian@tests.com" && password === "test123") {
        return { data: { user: mockUser, session: mockSession }, error: null };
      } else {
        return {
          data: { user: null, session: null },
          error: { message: "Invalid login credentials", status: 400 },
        };
      }
    }),
    getUser: jest.fn(async () => ({ data: { user: mockUser }, error: null })),
    getSession: jest.fn(async () => ({
      data: { session: mockSession },
      error: null,
    })),
  },
  from: jest.fn((table) => {
    switch (table) {
      case "projects":
        return createMockQueryBuilder(mockProjects);
      case "criteria":
        return createMockQueryBuilder(mockCriteria);
      case "choices":
        return createMockQueryBuilder(mockChoices);
      case "scores":
        return createMockQueryBuilder(mockScores);
      default:
        return createMockQueryBuilder([]);
    }
  }),
};

const createSupabaseClient = jest.fn(() => mockSupabaseClient);

const getAuthenticatedUser = jest.fn(async () => mockUser);

module.exports = { createSupabaseClient, getAuthenticatedUser };
