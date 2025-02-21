const { createClient } = require('@supabase/supabase-js');
const cookie = require('cookie');
const { CORS_HEADERS } = require('../../utils/CORS_HEADERS');

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

  if (event.httpMethod === "POST") {
    try {
      if (DEBUG) console.log("POST request received");
      const { error } = await supabase.auth.signOut();

      if (error) {
        if (DEBUG) console.log("Supabase signout error:", error);
        return {
          statusCode: error.status || 500,
          headers: { ...CORS_HEADERS(event) },
          body: JSON.stringify({ error: error.message || "Supabase signout error" }),
        };
      }

      // Get project reference and clear session cookie
      const projectRef = supabaseUrl.split(".")[0].replace("https://", "");
      const sessionCookieName = `sb-${projectRef}-auth-token`;

      // Expire the authentication cookie
      const expiredCookie = cookie.serialize(sessionCookieName, "", {
        httpOnly: true, // Prevent frontend JavaScript access
        secure: process.env.NODE_ENV === "production", // Secure only in production
        sameSite: "None", // Needed for cross-origin authentication
        maxAge: 0, // Immediately expires the cookie
        path: "/",
      });

      if (DEBUG) console.log("Cookie set:", expiredCookie);
      return {
        statusCode: 200,
        headers: {
          ...CORS_HEADERS(event),
          "Set-Cookie": expiredCookie, // Clear the session cookie
        },
        body: JSON.stringify({ message: "Sign out successful" }),
      };
    } catch (error) {
      if (DEBUG) console.log("Error signing out:", error);
      return {
        statusCode: 400,
        headers: { ...CORS_HEADERS(event) },
        body: JSON.stringify({ error: "Invalid request" }),
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
