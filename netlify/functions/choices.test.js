const { handler } = require('./choices');
const { createSupabaseClient, getAuthenticatedUser } = require('../../utils/supabaseClient');

jest.mock('../../utils/supabaseClient', () => ({
  createSupabaseClient: jest.fn(),
  getAuthenticatedUser: jest.fn(),
}));

const mockSupabase = {
  from: jest.fn(() => mockSupabase),
  select: jest.fn(() => mockSupabase),
  eq: jest.fn(() => mockSupabase),
  insert: jest.fn(() => mockSupabase),
  update: jest.fn(() => mockSupabase),
  delete: jest.fn(() => mockSupabase),
};

describe('Choices API', () => {
  const userId = 'user1';
  const projectId = 'project1';

  beforeEach(() => {
    jest.clearAllMocks();
    createSupabaseClient.mockReturnValue(mockSupabase);
    getAuthenticatedUser.mockResolvedValue(userId);

    mockSupabase.select.mockImplementation(() => mockSupabase);
    mockSupabase.eq.mockImplementation(() => mockSupabase);
    mockSupabase.insert.mockImplementation(() => mockSupabase);
    mockSupabase.update.mockImplementation(() => mockSupabase);
    mockSupabase.delete.mockImplementation(() => mockSupabase);
  });

  it('GET /choices?projectId=:id should return choices for a project', async () => {
    const mockChoices = [{ id: '1', description: 'Choice 1', disqualified: false }];
    mockSupabase.from.mockReturnValueOnce(mockSupabase);
    mockSupabase.select.mockReturnValueOnce(mockSupabase);
    mockSupabase.eq.mockResolvedValueOnce({ data: mockChoices, error: null });

    const event = {
      httpMethod: 'GET',
      queryStringParameters: { projectId: projectId },
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual(mockChoices);
    expect(mockSupabase.from).toHaveBeenCalledWith('choices');
    expect(mockSupabase.select).toHaveBeenCalledWith('*');
    expect(mockSupabase.eq).toHaveBeenCalledWith('project_id', projectId);
  });

  it('POST /choices should create new choices', async () => {
    const mockChoice = { id: '3', description: 'Choice 3', project_id: projectId };
    mockSupabase.from.mockReturnValueOnce(mockSupabase);
    mockSupabase.insert.mockReturnValueOnce(mockSupabase);
    mockSupabase.select.mockResolvedValueOnce({ data: [mockChoice], error: null });
    const event = {
      httpMethod: 'POST',
      body: JSON.stringify({ project_id: projectId, choices: [{ description: 'Choice 3'}] }),
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(201);
    expect(JSON.parse(response.body)).toEqual([mockChoice]);
    expect(mockSupabase.from).toHaveBeenCalledWith('choices');
    expect(mockSupabase.insert).toHaveBeenCalledWith([{ description: 'Choice 3', project_id: projectId, disqualified: false}]);
    expect(mockSupabase.select).toHaveBeenCalled();
  });

  it('POST /choices should return error if project_id is missing', async () => {
    const event = {
      httpMethod: 'POST',
      body: JSON.stringify({ choices: [{ description: 'Choice 3'}] }),
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body).error).toBe('Project ID is required in body');
  });

  it('POST /choices should return error if choices is missing', async () => {
    const event = {
      httpMethod: 'POST',
      body: JSON.stringify({ project_id: projectId }),
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body).error).toBe('Invalid request body: project_id and choices array are required');
  });

  it('PUT /choices/:id should update a choice', async () => {
    const mockChoice = { id: '1', description: 'Updated Choice', disqualified: true };
    mockSupabase.from.mockReturnValueOnce(mockSupabase);
    mockSupabase.update.mockReturnValueOnce(mockSupabase);
    mockSupabase.eq.mockReturnValueOnce(mockSupabase);
    mockSupabase.select.mockResolvedValueOnce({ data: [mockChoice], error: null });

    const event = {
      httpMethod: 'PUT',
      pathParameters: { id: '1' },
      body: JSON.stringify({ description: 'Updated Choice', disqualified: true }),
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual(mockChoice);
    expect(mockSupabase.from).toHaveBeenCalledWith('choices');
    expect(mockSupabase.update).toHaveBeenCalledWith({ description: 'Updated Choice', disqualified: true });
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', '1');
    expect(mockSupabase.select).toHaveBeenCalled();
  });

  it('PUT /choices/:id should return an error if no update data is provided', async() => {
    const event = {
      httpMethod: 'PUT',
      pathParameters: { id: '1' },
      body: JSON.stringify({}),
    };
    const response = await handler(event);
    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body).error).toBe('Invalid request body: at least one of description or disqualified must be provided');
  });

  it('DELETE /choices/:id should delete a choice', async () => {
    mockSupabase.from.mockReturnValueOnce(mockSupabase);
    mockSupabase.delete.mockReturnValueOnce(mockSupabase);
    mockSupabase.eq.mockResolvedValueOnce({ data: null, error: null });
    const event = {
      httpMethod: 'DELETE',
      pathParameters: { id: '1' },
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ message: 'Choice deleted successfully' });
    expect(mockSupabase.from).toHaveBeenCalledWith('choices');
    expect(mockSupabase.delete).toHaveBeenCalled();
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', '1');
  });
});
