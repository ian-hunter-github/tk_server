const { CORS_HEADERS } = require("../../utils/CORS_HEADERS");
const { getDatabaseInstance } = require("../../utils/dbFactory");

// Debug flag
const DEBUG = true;

exports.handler = async (event) => {
  if (DEBUG) console.log("Handler invoked");

  // Handle OPTIONS preflight requests
  if (event.httpMethod === "OPTIONS") {
    if (DEBUG) console.log("OPTIONS request received");
    return {
      statusCode: 204,
      headers: { ...CORS_HEADERS(event) },
      body: "",
    };
  }

  const db = getDatabaseInstance();

  const cookies = event.headers.cookie;
  let userId;

  if (cookies) {
    const sessionCookie = cookies
      .split(";")
      .find((c) => c.trim().startsWith("sb-auth-token="));
    if (sessionCookie) {
      const token = sessionCookie.split("=")[1];
      const { data, error } = await db.getUser(token);
      if (error) {
        console.error('Error getting user:', error);
        return {
          statusCode: 401,
          headers: { ...CORS_HEADERS(event) },
          body: JSON.stringify({ error: 'Unauthorized: Could not retrieve user.' }),
        };
      }
      userId = data.user.id;
    }
  }

  if (!userId) {
    return {
      statusCode: 401,
      headers: { ...CORS_HEADERS(event) },
      body: JSON.stringify({ error: 'Unauthorized' }),
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
      const { data: updatedScore, error } = await db.updateScore(userId, criteria_id, choice_id, score);

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
