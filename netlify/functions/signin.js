const { createClient } = require('@supabase/supabase-js');
const cookie = require('cookie');

exports.handler = async (event) => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "http://localhost:3000", // Update to match your frontend URL
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Credentials": "true",
      },
      body: JSON.stringify({ error: "Supabase environment variables not set" }),
    };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Handle CORS preflight request
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "http://localhost:3000", // Update if needed
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Credentials": "true",
      },
      body: "",
    };
  }

  if (event.httpMethod === "POST") {
    try {
      const { email, password } = JSON.parse(event.body);

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        return {
          statusCode: error.status || 500,
          headers: {
            "Access-Control-Allow-Origin": "http://localhost:3000",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Credentials": "true",
          },
          body: JSON.stringify({ error: error.message || "Supabase signin error" }),
        };
      }

      const projectRef = supabaseUrl.split('.')[0].replace('https://', '');
      const sessionCookieName = `sb-${projectRef}-auth-token`;

      // Set the authentication cookie
      const cookieString = cookie.serialize(sessionCookieName, data.session.access_token, {
        httpOnly: false, // Allow access via JavaScript
        secure: process.env.NODE_ENV === "production", // Secure only in production
        sameSite: 'Lax', // Needed for cross-origin cookie sharing
        maxAge: data.session.expires_in, // Use session expiration time
        path: '/' // Make cookie available across all routes
      });

      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "http://localhost:3000",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Credentials": "true",
          "Set-Cookie": cookieString, // Setting the auth cookie
        },
        body: JSON.stringify({
          message: "Sign in successful",
          user: data.user,
          session: data.session,
        }),
      };
    } catch (error) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "http://localhost:3000",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Credentials": "true",
        },
        body: JSON.stringify({ error: "Invalid JSON in request body" }),
      };
    }
  }

  return {
    statusCode: 405,
    headers: {
      "Access-Control-Allow-Origin": "http://localhost:3000",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Credentials": "true",
    },
    body: JSON.stringify({ error: "Method Not Allowed" }),
  };
};
