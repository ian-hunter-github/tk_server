const { CORS_HEADERS } = require("../../utils/CORS_HEADERS");
const { getSessionToken } = require("../../utils/getSessionToken");
const { getDatabaseInstance } = require('../../utils/dbFactory.js');

// Debug flag
const DEBUG = true;

exports.handler = async (event) => {
  
  if (DEBUG) console.log("[Session] Handler invoked");

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (DEBUG)
      console.log("[Session] !!!!!! Supabase environment variables not set");
    return {
      statusCode: 500,
      headers: { ...CORS_HEADERS(event) },
      body: JSON.stringify({ error: "Supabase environment variables not set" }),
    };
  }

  // Handle OPTIONS preflight requests
  if (event.httpMethod === "OPTIONS") {
    if (DEBUG) console.log("OPTIONS request received");
    return {
      statusCode: 204,
      headers: { ...CORS_HEADERS(event) },
      body: "",
    };
  }

  const db = getDatabaseInstance();

  if (event.httpMethod === "GET") {
    try {
      const accessToken = getSessionToken(event);
      if (DEBUG) console.log("[Session] accessToken:", accessToken);
      if (!accessToken) {
        if (DEBUG) console.log("[Session] No session token found");
        return {
          statusCode: 401,
          headers: { ...CORS_HEADERS(event) },
          body: JSON.stringify({ error: "No session token found" }),
        };
      }

      const {
        data: { user },
        error,
      } = await db.getUser(accessToken);
      if (DEBUG) console.log("[Session] Supabase user:", user);

      if (error || !user) {
        if (DEBUG) console.log("[Session] Supabase error:", error);
        return {
          statusCode: 401,
          headers: { ...CORS_HEADERS(event) },
          body: JSON.stringify({
            error: error ? error.message : "No user found",
          }),
        };
      }

      const response = {
        statusCode: 200,
        headers: {
          ...CORS_HEADERS(event),
          accessToken: accessToken,
        },
        body: JSON.stringify({ user }),
      };
      if (DEBUG) console.log("[Session] Complete Session response:", response);
      return response;
    } catch (error) {
      console.error("[Session] Error:", error);
      return {
        statusCode: 500,
        headers: { ...CORS_HEADERS(event) },
        body: JSON.stringify({ error: "Failed to retrieve user data." }),
      };
    }
  }

  if (DEBUG) console.log("[Session] Method not allowed");
  return {
    statusCode: 405,
    headers: { ...CORS_HEADERS(event) },
    body: JSON.stringify({ error: "Method Not Allowed" }),
  };
};
