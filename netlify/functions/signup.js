exports.handler = async (event, context) => {
  // Handle the OPTIONS method for preflight requests
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204, // No Content
      headers: {
        "Access-Control-Allow-Origin": "*", // Or specify your frontend origin
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS", // Allowed methods
        "Access-Control-Allow-Headers": "Content-Type", // Allowed headers
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

      // Proceed with your function logic (e.g., saving user info)
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*", // Or specify your frontend origin
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
        body: JSON.stringify({
          message: "Dummy response: Sign up successful",
          user: {
            id: 123,
            email: "dummy@example.com",
          },
        }),
      };
    } catch (error) {
      // Handle errors if body parsing fails
      return {
        statusCode: 400, // Bad Request
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

