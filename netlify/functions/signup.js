const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  const supabaseUrl = 'https://bqumdvfrgjcwcnbdbrps.supabase.co';
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxdW1kdmZyZ2pjd2NuYmRicnBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk4ODQ3NDIsImV4cCI6MjA1NTQ2MDc0Mn0.1u8pE3cLH6YjQIW1aiYUbyGiZ8__tb-ybChNf961fuE';

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
