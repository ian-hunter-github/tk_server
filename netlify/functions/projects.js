const { createClient } = require("@supabase/supabase-js");
const { getSessionToken } = require("../../utils/getSessionToken");
const { CORS_HEADERS } = require("../../utils/CORS_HEADERS");

const DEBUG = true;

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase environment variables not set");
  throw new Error("Supabase environment variables not set");
}

// ✅ Function to create a Supabase client with user authentication
const createSupabaseClient = (authToken) =>
  createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${authToken}` } },
  });

// ✅ Extract and authenticate user
const getAuthenticatedUser = async (supabase, sessionToken) => {
  const { data: user, error } = await supabase.auth.getUser(sessionToken);
  if (error || !user) throw new Error("Invalid session token");
  return user.user.id;
};

// ✅ Handle GET requests (Retrieve user's projects)
const handleGetProjects = async (supabase, userId) => {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("created_by", userId);
  if (error) throw new Error("Failed to fetch projects: " + error.message);
  return data;
};

// ✅ Handle POST requests (Create a new project)
const handleCreateProject = async (supabase, userId, body) => {
  const { name, description, criteria } = JSON.parse(body);
  if (!name) throw new Error("Project name is required");

  const { data, error } = await supabase
    .from("projects")
    .insert([{ name, description, criteria, created_by: userId }])
    .select();

  if (error) {
    if (error.code === "PGRST204")
      throw new Error(
        "Database error: The 'criteria' column is missing. Please contact support."
      );
    if (error.code === "42501")
      throw new Error(
        "You do not have permission to create projects. Please check your database permissions."
      );
    throw new Error("Failed to create project: " + error.message);
  }

  return data[0];
};

// ✅ Main handler function
exports.handler = async (event) => {
  try {
    if (DEBUG) console.log(`${event.httpMethod} request received`);

    // Handle OPTIONS preflight request
    if (event.httpMethod === "OPTIONS") {
      return { statusCode: 204, headers: { ...CORS_HEADERS(event) }, body: "" };
    }

    // Get session token from request
    const sessionToken = getSessionToken(event);
    if (!sessionToken) throw new Error("Unauthorized");

    // Initialize Supabase with user's token & authenticate user
    const supabase = createSupabaseClient(sessionToken);
    const userId = await getAuthenticatedUser(supabase, sessionToken);

    // Handle different request types
    let responseData;
    switch (event.httpMethod) {
      case "GET":
        responseData = await handleGetProjects(supabase, userId);
        break;
      case "POST":
        responseData = await handleCreateProject(supabase, userId, event.body);
        break;
      default:
        throw new Error("Method Not Allowed");
    }

    return {
      statusCode: event.httpMethod === "POST" ? 201 : 200,
      headers: { ...CORS_HEADERS(event) },
      body: JSON.stringify(responseData),
    };
  } catch (error) {
    if (DEBUG) console.error("Error:", error.message);
    return {
      statusCode: error.message === "Unauthorized" ? 401 : 500,
      headers: { ...CORS_HEADERS(event) },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
