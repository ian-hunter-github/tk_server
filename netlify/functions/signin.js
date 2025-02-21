const { createClient } = require("@supabase/supabase-js");
const cookie = require("cookie");
const { CORS_HEADERS } = require("../../utils/CORS_HEADERS");

// Debug flag
const DEBUG = true;

exports.handler = async (event) => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (DEBUG) console.log("Handler invoked");

  if (!supabaseUrl || !supabaseAnonKey) {
    if (DEBUG) console.log("Supabase environment variables not set");
    return {
      statusCode: 500,
      headers: { ...CORS_HEADERS(event) },
      body: JSON.stringify({ error: "Supabase environment variables not set" }),
    };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  if (DEBUG) console.log("Supabase client created");

  // Handle OPTIONS preflight requests
  if (event.httpMethod === "OPTIONS") {
    if (DEBUG) {
      console.log("OPTIONS request received");
      console.log(CORS_HEADERS(event))
    }
    return {
      statusCode: 204,
      headers: { ...CORS_HEADERS(event) },
      body: "",
    };
  }

  if (event.httpMethod === "POST") {
    try {
      if (DEBUG) console.log("POST request received");

      // Parse request body
      const { email, password } = JSON.parse(event.body);
      if (DEBUG) console.log("Parsed email:", email);

      // Attempt to sign in user
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (DEBUG) console.log("Supabase sign-in attempt result:", { data, error });

      if (error) {
        if (DEBUG) console.log("Supabase signin error:", error);
        return {
          statusCode: error.status || 500,
          headers: { ...CORS_HEADERS(event) },
          body: JSON.stringify({ error: error.message || "Supabase signin error" }),
        };
      }

      // Get project reference and set session cookie
      const projectRef = supabaseUrl.split(".")[0].replace("https://", "");
      const sessionCookieName = `sb-${projectRef}-auth-token`;

      const cookieString = cookie.serialize(sessionCookieName, data.session.access_token, {
        httpOnly: true, // Prevent JavaScript access
        secure: process.env.NODE_ENV === "production", // Secure only in production
        sameSite: "None", // Allows cross-origin authentication
        maxAge: data.session.expires_in, // Set expiration
        path: "/",
      });

      if (DEBUG) console.log("Cookie set:", cookieString);

      return {
        statusCode: 200,
        headers: {
          ...CORS_HEADERS(event),
          "Set-Cookie": cookieString,
        },
        body: JSON.stringify({
          message: "Sign in successful",
          user: data.user,
          session: data.session,
          accessToken: data.session.access_token, // Add access token to response
        }),
      };
    } catch (error) {
      if (DEBUG) console.log("Error during POST request:", error);
      return {
        statusCode: 400,
        headers: { ...CORS_HEADERS(event) },
        body: JSON.stringify({ error: "Invalid JSON in request body" }),
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
