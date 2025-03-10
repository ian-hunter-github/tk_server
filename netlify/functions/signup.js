const { createClient } = require("@supabase/supabase-js");
const cookie = require("cookie");
const { CORS_HEADERS } = require("../../utils/CORS_HEADERS");

exports.handler = async (event) => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      statusCode: 500,
      headers: { ...CORS_HEADERS(event) },
      body: JSON.stringify({ error: "Supabase environment variables not set" }),
    };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: { ...CORS_HEADERS(event) },
      body: "",
    };
  }

  if (event.httpMethod === "POST") {
    try {
      const { email, password } = JSON.parse(event.body);

      if (!email || !password) {
        return {
          statusCode: 400,
          headers: { ...CORS_HEADERS(event) },
          body: JSON.stringify({ error: "Email and password are required" })
        };
      }

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        console.error("Supabase signup error:", signUpError);
        return {
          statusCode: signUpError.status || 500,
          headers: { ...CORS_HEADERS(event) },
          body: JSON.stringify({ error: signUpError.message || "Supabase signup error" }),
        };
      }

      // Remove automatic sign-in after signup
      // TODO: Revisit cookie setting - should we set a cookie on signup?
      // const cookieString = ...

      return {
        statusCode: 200,
        headers: {
          ...CORS_HEADERS(event),
          // "Set-Cookie": cookieString, // Removed cookie setting for now
        },
        body: JSON.stringify({
          message: "Sign up successful",
          user: { email: signUpData.user.email, id: signUpData.user.id }, // Return only essential user data
        }),
      };
    } catch (error) {
      console.error("Error in signup function:", error);
      return {
        statusCode: 400,
        headers: { ...CORS_HEADERS(event) },
        body: JSON.stringify({ error: "Invalid JSON in request body" }),
      };
    }
  }

  return {
    statusCode: 405,
    headers: { ...CORS_HEADERS(event) },
    body: JSON.stringify({ error: "Method Not Allowed" }),
  };
};
