const { handler } = require('./scores');
const { createSupabaseClient, getAuthenticatedUser } = require('../../utils/supabaseClient');

jest.mock('../../utils/supabaseClient', () => ({
  createSupabaseClient: jest.fn(),
  getAuthenticatedUser: jest.fn(),
}));

const mockSupabase = {
  from: jest.fn(() => mockSupabase),
  upsert: jest.fn(() => mockSupabase),
  select: jest.fn(() => mockSupabase),
};

describe('Scores API', () => {
  const userId = 'user1';

  beforeEach(() => {
    jest.clearAllMocks();
    createSupabaseClient.mockReturnValue(mockSupabase);
    getAuthenticatedUser.mockResolvedValue({ id: userId });

    mockSupabase.select.mockImplementation(() => mockSupabase);
    mockSupabase.upsert.mockImplementation(() => mockSupabase);
  });

  it('PUT /scores should create or update a score', async () => {
    const mockScore = { criteria_id: 'criteria1', choice_id: 'choice1', score: 4, userId };
    mockSupabase.from.mockReturnValueOnce(mockSupabase);
    mockSupabase.upsert.mockReturnValueOnce(mockSupabase);
    mockSupabase.select.mockResolvedValueOnce({ data: [mockScore], error: null });

    const event = {
      httpMethod: 'PUT',
      body: JSON.stringify(mockScore),
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual(mockScore);
    expect(mockSupabase.from).toHaveBeenCalledWith('scores');
    expect(mockSupabase.upsert).toHaveBeenCalledWith(mockScore, { onConflict: 'criteria_id,choice_id' });
    expect(mockSupabase.select).toHaveBeenCalled();
  });

  it('PUT /scores should return an error if criteria_id is missing', async () => {
    const event = {
      httpMethod: 'PUT',
      body: JSON.stringify({ choice_id: 'choice1', score: 4, userId }),
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body).error).toBe('Invalid request body: criteria_id, choice_id, score and userId are required');
  });

  it('PUT /scores should return an error if choice_id is missing', async () => {
    const event = {
      httpMethod: 'PUT',
      body: JSON.stringify({ criteria_id: 'criteria1', score: 4, userId }),
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body).error).toBe('Invalid request body: criteria_id, choice_id, score and userId are required');
  });

  it('PUT /scores should return an error if score is missing', async () => {
    const event = {
      httpMethod: 'PUT',
      body: JSON.stringify({ criteria_id: 'criteria1', choice_id: 'choice1', userId }),
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body).error).toBe('Invalid request body: criteria_id, choice_id, score and userId are required');
  });

  it('PUT /scores should return an error if score is invalid', async () => {
    const event = {
      httpMethod: 'PUT',
      body: JSON.stringify({ criteria_id: 'criteria1', choice_id: 'choice1', score: 6, userId }),
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body).error).toBe('Invalid score: Score must be between 1 and 5');
  });
});
