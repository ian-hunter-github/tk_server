const { createClient } = require("@supabase/supabase-js");
const { getSessionToken } = require("../../utils/getSessionToken");
const { CORS_HEADERS } = require("../../utils/CORS_HEADERS");

const DEBUG = true;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase environment variables not set");
  throw new Error("Supabase environment variables not set");
}

const createSupabaseClient = (authToken) =>
  createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${authToken}` } },
  });

const getAuthenticatedUser = async (supabase, sessionToken) => {
  const { data: user, error } = await supabase.auth.getUser(sessionToken);
  if (error || !user) throw new Error("Invalid session token");
  return user.user.id;
};

const handleGetCriteria = async (supabase, projectId) => {
  const { data, error } = await supabase
    .from("criteria")
    .select("*")
    .eq("project_id", projectId);
  if (error) throw new Error("Failed to fetch criteria: " + error.message);
  return data;
};

const handleCreateCriteria = async (supabase, projectId, body) => {
  const criteria = JSON.parse(body);
  if (!Array.isArray(criteria) || criteria.length === 0) {
    throw new Error("Invalid criteria data");
  }

  const formattedCriteria = criteria.map(({ definition, weight }) => ({
    project_id: projectId,
    definition,
    weight,
  }));

  const { data, error } = await supabase
    .from("criteria")
    .insert(formattedCriteria)
    .select();

  if (error) throw new Error("Failed to save criteria: " + error.message);
  return data;
};

exports.handler = async (event) => {
  try {
    if (DEBUG) console.log(`${event.httpMethod} request received`);

    if (event.httpMethod === "OPTIONS") {
      return { statusCode: 204, headers: { ...CORS_HEADERS(event) }, body: "" };
    }

    const sessionToken = getSessionToken(event);
    if (!sessionToken) throw new Error("Unauthorized");

    const supabase = createSupabaseClient(sessionToken);
    const userId = await getAuthenticatedUser(supabase, sessionToken);
    const projectId = event.queryStringParameters.projectId;
    if (!projectId) throw new Error("Project ID is required");

    let responseData;
    switch (event.httpMethod) {
      case "GET":
        responseData = await handleGetCriteria(supabase, projectId);
        break;
      case "POST":
        responseData = await handleCreateCriteria(supabase, projectId, event.body);
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
