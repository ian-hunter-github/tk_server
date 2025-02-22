const { createClient } = require('@supabase/supabase-js');
const { getSessionToken } = require('./getSessionToken');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase environment variables not set');
}

const createSupabaseClient = (event) => {
  const sessionToken = getSessionToken(event);
  if (!sessionToken) {
    throw new Error('Unauthorized: No session token provided');
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${sessionToken}` } },
  });
};

const getAuthenticatedUser = async (supabase) => {
    const { data: user, error } = await supabase.auth.getUser();
    if (error || !user) {
        throw new Error("Invalid session token: " + error.message);
    }
    return user.user;
}

module.exports = { createSupabaseClient, getAuthenticatedUser };
