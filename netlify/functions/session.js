const { createClient } = require('@supabase/supabase-js');
const { getSessionToken } = require('../../utils/getSessionToken'); // Ensure this helper is used
const { CORS_HEADERS } = require('../../utils/CORS_HEADERS');

// Debug flag
const DEBUG = false;

exports.handler = async (event) => {
  if (DEBUG) console.log("Handler invoked");

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (DEBUG) console.log("Supabase environment variables not set");
    return {
      statusCode: 500,
      headers: { ...CORS_HEADERS(event) },
      body: JSON.stringify({ error: "Supabase environment variables not set" }),
    };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Handle OPTIONS preflight requests
  if (event.httpMethod === "OPTIONS") {
    if (DEBUG) console.log("OPTIONS request received");
    return {
      statusCode: 204,
      headers: { ...CORS_HEADERS(event) },
      body: "",
    };
  }

  if (event.httpMethod === "GET") {
    try {
      // Retrieve the session token using helper function
      const sessionToken = getSessionToken(event);
      if (DEBUG) console.log("GET request received, sessionToken:", sessionToken);

      if (!sessionToken) {
        if (DEBUG) console.log("No session token found");
        return {
          statusCode: 401,
          headers: { ...CORS_HEADERS(event) },
          body: JSON.stringify({ error: "No session token found" }),
        };
      }

      // ✅ Securely get the user from Supabase (instead of manually decoding JWT)
      const { data: user, error } = await supabase.auth.getUser(sessionToken);

      if (error) {
        if (DEBUG) console.log("Invalid session token");
        return {
          statusCode: 401,
          headers: { ...CORS_HEADERS(event) },
          body: JSON.stringify({ error: "Invalid session token" }),
        };
      }

      return {
        statusCode: 200,
        headers: { ...CORS_HEADERS(event) },
        body: JSON.stringify({ session: user }),
      };

    } catch (error) {
      if (DEBUG) console.log("Error retrieving session:", error);
      return {
        statusCode: 500,
        headers: { ...CORS_HEADERS(event) },
        body: JSON.stringify({ error: "Error retrieving session" }),
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
