const { createClient } = require("@supabase/supabase-js");
const cookie = require("cookie");
const { CORS_HEADERS } = require("../../utils/CORS_HEADERS");

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

  // Handle the OPTIONS method for preflight requests
  if (event.httpMethod === "OPTIONS") {
    if (DEBUG) console.log("OPTIONS request received");
    return {
      statusCode: 204, // No Content
      headers: { ...CORS_HEADERS(event) },
      body: "",
    };
  }

  // Handle the POST request
  if (event.httpMethod === "POST") {
    try {
      // Parse request body
      const { email, password } = JSON.parse(event.body);
      if (DEBUG) console.log("POST request received with email:", email, "password:", password);

      // Sign up the user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        console.error("Supabase signup error:", signUpError);
        if (DEBUG) console.log("Supabase signup error:", signUpError);
        return {
          statusCode: signUpError.status || 500,
          headers: { ...CORS_HEADERS(event) },
          body: JSON.stringify({ error: signUpError.message || "Supabase signup error" }),
        };
      }

      // Automatically sign in the user after signup
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error("Supabase signin error:", signInError);
        if (DEBUG) console.log("Supabase signin error:", signInError);
        return {
          statusCode: signInError.status || 500,
          headers: { ...CORS_HEADERS(event)},
          body: JSON.stringify({ error: signInError.message || "Supabase signin error" }),
        };
      }

      // Set session cookie
      const projectRef = supabaseUrl.split(".")[0].replace("https://", "");
      const sessionCookieName = `sb-${projectRef}-auth-token`;
      const sessionToken = signInData.session.access_token;

      const cookieString = cookie.serialize(sessionCookieName, sessionToken, {
        httpOnly: true, // Prevent frontend JavaScript access
        secure: process.env.NODE_ENV === "production", // Secure only in production
        sameSite: "None", // Allows cross-site requests
        maxAge: signInData.session.expires_in, // Set expiration
        path: "/",
      });

      if (DEBUG) console.log("Cookie set:", cookieString);

      return {
        statusCode: 200,
        headers: {
          ...CORS_HEADERS(event),
          "Set-Cookie": cookieString, // Set session cookie
        },
        body: JSON.stringify({
          message: "Sign up & sign in successful",
          user: signUpData.user,
          session: signInData.session,
          accessToken: signInData.session.access_token, // Include access token in response
        }),
      };
    } catch (error) {
      console.error("Error in signup function:", error);
      if (DEBUG) console.log("Error in signup function:", error);
      return {
        statusCode: 400,
        headers: { ...CORS_HEADERS(event) },
        body: JSON.stringify({ error: "Invalid JSON in request body" }),
      };
    }
  }

  // Default response for unsupported methods
  if (DEBUG) console.log("Method not allowed");
  return {
    statusCode: 405, // Method Not Allowed
    headers: { ...CORS_HEADERS(event) },
    body: JSON.stringify({ error: "Method Not Allowed" }),
  };
};
