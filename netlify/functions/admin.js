const { createClient } = require('@supabase/supabase-js');
const { getSessionToken } = require('../../utils/getSessionToken');
const { CORS_HEADERS } = require('../../utils/CORS_HEADERS');

// Debug flag
const DEBUG = true;

exports.handler = async (event) => {
  if (DEBUG) console.log("Handler invoked");

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // ✅ Secure admin key

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    if (DEBUG) console.log("Supabase environment variables not set");
    return {
      statusCode: 500,
      headers: { ...CORS_HEADERS(event) },
      body: JSON.stringify({ error: "Supabase environment variables not set" }),
    };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } }); // ✅ Admin client

  // Handle OPTIONS preflight requests
  if (event.httpMethod === "OPTIONS") {
    if (DEBUG) console.log("OPTIONS request received");
    return {
      statusCode: 204,
      headers: { ...CORS_HEADERS(event) },
      body: "",
    };
  }

  // ✅ Get session token securely
  const sessionToken = getSessionToken(event);
  if (!sessionToken) {
    if (DEBUG) console.log("No session token found");
    return {
      statusCode: 401,
      headers: { ...CORS_HEADERS(event) },
      body: JSON.stringify({ error: "Unauthorized" }),
    };
  }

  // ✅ Securely retrieve user from Supabase
  const { data: user, error } = await supabase.auth.getUser(sessionToken);
  if (error || !user) {
    if (DEBUG) console.log("Invalid session token");
    return {
      statusCode: 401,
      headers: { ...CORS_HEADERS(event) },
      body: JSON.stringify({ error: "Invalid session token" }),
    };
  }

  // ✅ Check if the user has an "admin" role
  const { data: userRole, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (roleError || !userRole || userRole.role !== 'admin') {
    if (DEBUG) console.log("Access denied: Admins only");
    return {
      statusCode: 403,
      headers: { ...CORS_HEADERS(event) },
      body: JSON.stringify({ error: "Access denied: Admins only" }),
    };
  }

  // ✅ Handle GET request - Retrieve users with pagination
  if (event.httpMethod === "GET") {
    try {
      const { limit = 10, offset = 0 } = event.queryStringParameters || {};
      if (DEBUG) console.log("GET request received with limit:", limit, "offset:", offset);

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .range(Number(offset), Number(offset) + Number(limit) - 1);

      if (error) throw error;

      return {
        statusCode: 200,
        headers: { ...CORS_HEADERS(event) },
        body: JSON.stringify({ users: data }),
      };
    } catch (error) {
      console.error("Error fetching users:", error);
      if (DEBUG) console.log("Error fetching users:", error);
      return {
        statusCode: 500,
        headers: { ...CORS_HEADERS(event) },
        body: JSON.stringify({ error: "Failed to fetch users" }),
      };
    }
  }

  // ✅ Handle DELETE request - Delete user (admin only)
  if (event.httpMethod === "DELETE") {
    try {
      const { id } = JSON.parse(event.body);
      if (DEBUG) console.log("DELETE request received for user ID:", id);

      if (!id) {
        if (DEBUG) console.log("User ID is required");
        return {
          statusCode: 400,
          headers: { ...CORS_HEADERS(event) },
          body: JSON.stringify({ error: "User ID is required" }),
        };
      }

      const { error } = await supabaseAdmin.auth.admin.deleteUser(id); // ✅ Requires Service Role Key

      if (error) throw error;

      return {
        statusCode: 200,
        headers: { ...CORS_HEADERS(event) },
        body: JSON.stringify({ message: "User deleted successfully" }),
      };
    } catch (error) {
      console.error("Error deleting user:", error);
      if (DEBUG) console.log("Error deleting user:", error);
      return {
        statusCode: 500,
        headers: { ...CORS_HEADERS(event) },
        body: JSON.stringify({ error: "Failed to delete user" }),
      };
    }
  }

  if (DEBUG) console.log("Method not allowed");
  return {
    statusCode: 405,
    headers: { ...CORS_HEADERS(event) },
    body: JSON.stringify({ error: "Method Not Allowed" }),
  };
};
