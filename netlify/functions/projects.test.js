const { handler } = require('./projects');
const { createSupabaseClient, getAuthenticatedUser } = require('../../utils/supabaseClient');

jest.mock('../../utils/supabaseClient', () => ({
  createSupabaseClient: jest.fn(),
  getAuthenticatedUser: jest.fn(),
}));

const mockSupabase = {
  from: jest.fn(() => mockSupabase),
  select: jest.fn(() => mockSupabase),
  eq: jest.fn(() => mockSupabase),
  single: jest.fn(() => mockSupabase),
  insert: jest.fn(() => mockSupabase),
  update: jest.fn(() => mockSupabase),
  delete: jest.fn(() => mockSupabase),
};

describe('Projects API', () => {
  const userId = '1';
  beforeEach(() => {
    jest.clearAllMocks();
    createSupabaseClient.mockReturnValue(mockSupabase);
    getAuthenticatedUser.mockResolvedValue({ id: userId });

    // Reset mock implementations before each test
    mockSupabase.select.mockImplementation(() => mockSupabase);
    mockSupabase.eq.mockImplementation(() => mockSupabase);
    mockSupabase.insert.mockImplementation(() => mockSupabase);
    mockSupabase.update.mockImplementation(() => mockSupabase);
    mockSupabase.delete.mockImplementation(() => mockSupabase);
    mockSupabase.single.mockImplementation(() => mockSupabase);
  });

  it('GET /projects should return all projects for the user', async () => {
    const mockProjects = [{ id: '1', title: 'Project 1', created_by: userId }, { id: '2', title: 'Project 2', created_by: userId }];

    // Mock the chained calls correctly
    mockSupabase.from.mockReturnValueOnce(mockSupabase);
    mockSupabase.select.mockReturnValueOnce(mockSupabase);
    mockSupabase.eq.mockResolvedValueOnce({ data: mockProjects, error: null });

    const event = {
      httpMethod: 'GET',
      pathParameters: {},
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual(mockProjects);
    expect(mockSupabase.from).toHaveBeenCalledWith('projects');
    expect(mockSupabase.select).toHaveBeenCalledWith('*');
    expect(mockSupabase.eq).toHaveBeenCalledWith('created_by', userId);
  });

  it('POST /projects should return an error if title is missing', async () => {
    const mockEvent = {
      httpMethod: 'POST',
      body: JSON.stringify({ description: 'Test Description' }), // Missing title
    };

    const response = await handler(mockEvent);

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body).error).toBe('Project title is required');
  });

  it('POST /projects should create a project', async () => {
    const mockProject = { id: '3', title: 'Project 3', description: 'Description' };

    // Mock the chained calls correctly
    mockSupabase.from.mockReturnValueOnce(mockSupabase);
    mockSupabase.insert.mockReturnValueOnce(mockSupabase);
    mockSupabase.select.mockResolvedValueOnce({ data: [mockProject], error: null });

    const event = {
      httpMethod: 'POST',
      body: JSON.stringify({ title: 'Project 3', description: 'Description' }),
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(201);
    expect(JSON.parse(response.body)).toEqual(mockProject);
    expect(mockSupabase.from).toHaveBeenCalledWith('projects');
    expect(mockSupabase.insert).toHaveBeenCalledWith([{ title: 'Project 3', description: 'Description', created_by: userId }]);
    expect(mockSupabase.select).toHaveBeenCalled();
  });

  it('GET /projects/:id should return a single project', async () => {
    const mockProject = { id: '1', title: 'Project 1' };

    // Mock the chained calls correctly
    mockSupabase.from.mockReturnValueOnce(mockSupabase);
    mockSupabase.select.mockReturnValueOnce(mockSupabase);
    mockSupabase.eq.mockReturnValueOnce(mockSupabase).mockReturnValueOnce(mockSupabase);
    mockSupabase.single.mockResolvedValueOnce({ data: mockProject, error: null });

    const event = {
      httpMethod: 'GET',
      pathParameters: { id: '1' },
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual(mockProject);
    expect(mockSupabase.from).toHaveBeenCalledWith('projects');
    expect(mockSupabase.select).toHaveBeenCalledWith('*');
    expect(mockSupabase.eq).toHaveBeenCalledWith('created_by', userId);
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', '1');
    expect(mockSupabase.single).toHaveBeenCalled();
  });

  it('PUT /projects/:id should update a project', async () => {
    const mockProject = { id: '1', title: 'Project 1 Updated', description: 'Updated Description' };

    // Mock the chained calls correctly
    mockSupabase.from.mockReturnValueOnce(mockSupabase);
    mockSupabase.update.mockReturnValueOnce(mockSupabase);
    mockSupabase.eq.mockReturnValueOnce(mockSupabase).mockReturnValueOnce(mockSupabase);
    mockSupabase.select.mockResolvedValueOnce({ data: [mockProject], error: null });

    const event = {
      httpMethod: 'PUT',
      pathParameters: { id: '1' },
      body: JSON.stringify({ title: 'Project 1 Updated', description: 'Updated Description' }),
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual(mockProject);
    expect(mockSupabase.from).toHaveBeenCalledWith('projects');
    expect(mockSupabase.update).toHaveBeenCalledWith({ title: 'Project 1 Updated', description: 'Updated Description' });
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', '1');
    expect(mockSupabase.eq).toHaveBeenCalledWith('created_by', userId);
    expect(mockSupabase.select).toHaveBeenCalled();
  });

  it('DELETE /projects/:id should delete a project', async () => {
    // Mock the chained calls correctly
    mockSupabase.from.mockReturnValueOnce(mockSupabase);
    mockSupabase.delete.mockReturnValueOnce(mockSupabase);
    mockSupabase.eq.mockReturnValueOnce(mockSupabase).mockReturnValueOnce(mockSupabase);
    mockSupabase.eq.mockResolvedValueOnce({ data: null, error: null });

    const event = {
      httpMethod: 'DELETE',
      pathParameters: { id: '1' },
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ message: 'Project deleted successfully' });
    expect(mockSupabase.from).toHaveBeenCalledWith('projects');
    expect(mockSupabase.delete).toHaveBeenCalled();
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', '1');
    expect(mockSupabase.eq).toHaveBeenCalledWith('created_by', userId);
  });
});
