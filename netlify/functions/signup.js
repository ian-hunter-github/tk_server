const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({ error: "Supabase environment variables not set" }),
    };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log("Supabase client created");

    // Handle the OPTIONS method for preflight requests
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204, // No Content
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: "",
    };
  }

  // Handle the POST request
  if (event.httpMethod === "POST") {
    try {
      // Parse the body of the request
      const { email, password } = JSON.parse(event.body);

      // Log the values to check
      console.log("Email:", email, "Password:", password);

      const { data, error } = await supabase.auth.signUp({ email, password });

      if (error) {
        console.error("Supabase error:", error);
        return {
          statusCode: error.status || 500,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
          body: JSON.stringify({ error: error.message || "Supabase signup error" }),
        };
      }

      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
        body: JSON.stringify({
          message: "Sign up successful",
          user: data.user,
        }),
      };
    } catch (error) {
      console.error("Error in signup function:", error);
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        },
        body: JSON.stringify({ error: "Invalid JSON in request body" }),
      };
    }
  }

  // Default response for unsupported methods
  return {
    statusCode: 405, // Method Not Allowed
    body: JSON.stringify({ error: "Method Not Allowed" }),
  };
};
