const { createClient } = require("@supabase/supabase-js");
const { CORS_HEADERS } = require("../../utils/CORS_HEADERS");
const { getSessionToken } = require("../../utils/getSessionToken");

// Debug flag
const DEBUG = true;

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

  const cookies = event.headers.cookie;
  let userId;
  let token;
  let supabase;

  if (cookies) {
    const sessionCookie = cookies
      .split(";")
      .find((c) => c.trim().startsWith("sb-auth-token="));
    if (sessionCookie) {
      token = sessionCookie.split("=")[1];
    }

    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    if (sessionCookie) {
      // Use getUser with the JWT directly
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser(token);

      if (userError || !user) {
        console.error("Error getting user:", userError);
        throw new Error("Unauthorized: Could not retrieve user.");
      }
      userId = user.id;
    }
  } else {
    // For OPTIONS requests, create an unauthenticated client
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  }

  if (event.httpMethod !== "OPTIONS" && !userId) {
    return {
        statusCode: 401,
        headers: { ...CORS_HEADERS(event) },
        body: JSON.stringify({ error: "Unauthorized" }),
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

  // Handle the PUT request
  if (event.httpMethod === "PUT") {
    try {
      if (DEBUG) console.log("PUT request received");

      // Parse request body
      const { criteria_id, choice_id, score } = JSON.parse(event.body);

      // Validate required fields.  Note: userId is already validated above
      if (!criteria_id || !choice_id || typeof score !== "number") {
        throw new Error(
          "Invalid request body: criteria_id, choice_id, and score are required"
        );
      }

      if (score < 0 || score > 5) {
        throw new Error("Invalid score: Score must be between 0 and 5");
      }

      // Update or insert score
      const { data: updatedScore, error } = await supabase
        .from("scores")
        .upsert(
          {
            criteria_id,
            choice_id,
            score,
            created_by: userId,
          },
          { onConflict: "criteria_id,choice_id" }
        ) // Use onConflict to specify unique constraint
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        statusCode: 200,
        headers: { ...CORS_HEADERS(event) },
        body: JSON.stringify(updatedScore),
      };
    } catch (error) {
      console.error("Error:", error.message);
      if (DEBUG) console.log("Error:", error.message);
      return {
        statusCode: error.message.startsWith("Unauthorized") ? 401 : 500,
        headers: { ...CORS_HEADERS(event) },
        body: JSON.stringify({ error: error.message }),
      };
    }
  }

  // Default response for unsupported methods
  if (DEBUG) console.log("Method not allowed");
  return {
    statusCode: 405,
    headers: { ...CORS_HEADERS(event) },
    body: JSON.stringify({ error: "Method Not Allowed" }),
  };
};
