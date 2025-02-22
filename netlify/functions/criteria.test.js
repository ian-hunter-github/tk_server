const { handler } = require('./criteria');
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

describe('Criteria API', () => {
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

  it('GET /criteria?projectId=:id should return criteria for a project', async () => {
    const mockCriteria = [{ id: '1', definition: 'Criterion 1', weight: 2 }];
    mockSupabase.from.mockReturnValueOnce(mockSupabase);
    mockSupabase.select.mockReturnValueOnce(mockSupabase);
    mockSupabase.eq.mockResolvedValueOnce({ data: mockCriteria, error: null });

    const event = {
      httpMethod: 'GET',
      queryStringParameters: { projectId: projectId },
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual(mockCriteria);
    expect(mockSupabase.from).toHaveBeenCalledWith('criteria');
    expect(mockSupabase.select).toHaveBeenCalledWith('*');
    expect(mockSupabase.eq).toHaveBeenCalledWith('project_id', projectId);
  });

 it('POST /criteria should create new criteria', async () => {
    const mockCriterion = { id: '1', definition: 'New Criterion', weight: 3, project_id: projectId };
    mockSupabase.from.mockReturnValueOnce(mockSupabase);
    mockSupabase.insert.mockReturnValueOnce(mockSupabase);
    mockSupabase.select.mockResolvedValueOnce({ data: [mockCriterion], error: null });
    const event = {
      httpMethod: 'POST',
      body: JSON.stringify({ project_id: projectId, criteria: [{ definition: 'New Criterion', weight: 3 }] }),
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(201);
    expect(JSON.parse(response.body)).toEqual([mockCriterion]);
    expect(mockSupabase.from).toHaveBeenCalledWith('criteria');
    expect(mockSupabase.insert).toHaveBeenCalledWith([{ definition: 'New Criterion', weight: 3, project_id: projectId}]);
    expect(mockSupabase.select).toHaveBeenCalled();
  });

  it('POST /criteria should return error if project_id is missing', async () => {
      const event = {
          httpMethod: 'POST',
          body: JSON.stringify({ criteria: [{ definition: 'New Criterion', weight: 3 }] }),
      };

      const response = await handler(event);
      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body).error).toBe('Project ID is required in body');
  });

  it('POST /criteria should return error if criteria is missing', async () => {
      const event = {
          httpMethod: 'POST',
          body: JSON.stringify({ project_id: projectId }),
      };

      const response = await handler(event);
      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body).error).toBe('Invalid request body: project_id and criteria array are required');
  });


  it('PUT /criteria/:id should update a criterion', async () => {
    const mockCriterion = { id: '1', definition: 'Updated Criterion', weight: 4 };
    mockSupabase.from.mockReturnValueOnce(mockSupabase);
    mockSupabase.update.mockReturnValueOnce(mockSupabase);
    mockSupabase.eq.mockReturnValueOnce(mockSupabase);
    mockSupabase.select.mockResolvedValueOnce({ data: [mockCriterion], error: null });

    const event = {
      httpMethod: 'PUT',
      pathParameters: { id: '1' },
      body: JSON.stringify({ definition: 'Updated Criterion', weight: 4 }),
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual(mockCriterion);
    expect(mockSupabase.from).toHaveBeenCalledWith('criteria');
    expect(mockSupabase.update).toHaveBeenCalledWith({ definition: 'Updated Criterion', weight: 4 });
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', '1');
    expect(mockSupabase.select).toHaveBeenCalled();
  });

  it('DELETE /criteria/:id should delete a criterion', async () => {
    mockSupabase.from.mockReturnValueOnce(mockSupabase);
    mockSupabase.delete.mockReturnValueOnce(mockSupabase);
    mockSupabase.eq.mockResolvedValueOnce({ data: null, error: null });
    const event = {
      httpMethod: 'DELETE',
      pathParameters: { id: '1' },
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ message: 'Criterion deleted successfully' });
    expect(mockSupabase.from).toHaveBeenCalledWith('criteria');
    expect(mockSupabase.delete).toHaveBeenCalled();
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', '1');
  });
});
