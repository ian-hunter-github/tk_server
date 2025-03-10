jest.mock('@supabase/supabase-js', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
  };

  const mockSession = {
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    expires_in: 3600,
    user: mockUser
  };

  // Create a reusable mock for the query builder methods
  const mockFrom = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    // Add .then for resolving promises and chainability
    then: jest.fn().mockImplementation(function(resolve, reject) {
      if (this.resolvedValue && this.resolvedValue.error) {
        if (reject) {
          reject(this.resolvedValue.error);
        }
      } else if (resolve) {
        resolve(this.resolvedValue);
      }
      return this; // Maintain chainability
    }),
    // Method to set the resolved value for testing
    mockResolvedValue: function(value) {
      this.resolvedValue = value;
      return this;
    }
  };

  const mockSupabaseClient = {
    auth: {
      signInWithPassword: jest.fn(async ({ email, password }) => {
        if (email === 'ian@tests.com' && password === 'test123') {
          return { data: { user: mockUser, session: mockSession }, error: null };
        } else {
          return { data: { user: null, session: null }, error: { message: 'Invalid login credentials', status: 400 } }
        }
      }),
      getUser: jest.fn(async () => ({ data: { user: mockUser }, error: null })),
      getSession: jest.fn(async () => ({ data: {session: mockSession}, error: null })),
    },
    from: jest.fn(() => mockFrom),
  };

  return {
    createClient: jest.fn(() => mockSupabaseClient)
  };
});

// Set environment variables here
process.env.SUPABASE_URL = "https://test.supabase.co";
process.env.SUPABASE_ANON_KEY = "test-key";
process.env.SUPABASE_JWT_SECRET = "test-jwt-secret";
