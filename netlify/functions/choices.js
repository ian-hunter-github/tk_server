const { CORS_HEADERS } = require("../../utils/CORS_HEADERS");
const { getPathId } = require("../../utils/getPathId");
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

  // Handle the GET request
  if (event.httpMethod === "GET") {
    try {
      if (DEBUG) console.log("GET request received");

      // Get project ID from query parameters
      const projectId = event.queryStringParameters?.projectId;
      if (!projectId) {
        throw new Error("Project ID is required in query parameters");
      }

      // Fetch choices
      const { data: choices, error } = await db.fetchChoices(userId, projectId);

      if (error) {
        throw error;
      }

      return {
        statusCode: 200,
        headers: { ...CORS_HEADERS(event) },
        body: JSON.stringify(choices),
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

  // Handle the POST request
  if (event.httpMethod === "POST") {
    try {
      if (DEBUG) console.log("POST request received");

      // Parse request body
      const { project_id, choices } = JSON.parse(event.body);
      // Validate required fields
      if (!project_id) {
        throw new Error("Project ID is required in body");
      }
      if (!choices || !Array.isArray(choices)) {
        throw new Error(
          "Invalid request body: project_id and choices array are required"
        );
      }

      // Insert choices
      const { data: insertedChoices, error } = await db.createChoices(userId, project_id, choices);

      if (error) {
        throw error;
      }

      // Fetch existing criteria for the project
      const { data: existingCriteria, error: fetchCriteriaError } = await db.fetchCriteria(userId, project_id);

      if (fetchCriteriaError) {
        throw fetchCriteriaError;
      }

      // Create default scores for each new choice and existing criterion
      if (insertedChoices && existingCriteria && existingCriteria.length > 0) {
          const scoresToInsert = [];
          for (const choice of insertedChoices) {
              for (const criterion of existingCriteria) {
                  scoresToInsert.push({
                      criteria_id: criterion.id,
                      choice_id: choice.id,
                      score: 0, // Default score
                      created_by: userId,
                  });
              }
          }

        if (DEBUG) console.log("Inserting default scores:", scoresToInsert);
        // TODO: updateScore does not currently support inserting multiple
        // const { error: insertScoresError } = await db.updateScore(userId, scoresToInsert);

        // if (insertScoresError) {
        //   throw insertScoresError;
        // }
    }

      return {
        statusCode: 201,
        headers: { ...CORS_HEADERS(event) },
        body: JSON.stringify(insertedChoices),
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

  // Handle the PUT request
  if (event.httpMethod === "PUT") {
    try {
      if (DEBUG) console.log("PUT request received");

      // Get choice ID from path parameters

      const { id: choiceId, error: pathError, statusCode: pathStatusCode, headers: pathHeaders, body: pathBody } = getPathId(event, "choices");
      if (pathError) {
        return { statusCode: pathStatusCode, headers: pathHeaders, body: pathBody };
      }

      // Parse request body
      const updates = JSON.parse(event.body);

      // Update choice
      const { data: updatedChoice, error } = await db.updateChoice(userId, choiceId, updates);

      if (DEBUG) console.log("Supabase update result:", { updatedChoice, error });

      if (error) {
        throw error;
      }

      if (!updatedChoice) {
          throw new Error("No choice found with the given ID and user.");
      }

      return {
        statusCode: 200,
        headers: { ...CORS_HEADERS(event) },
        body: JSON.stringify(updatedChoice),
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

  // Handle the DELETE request
  if (event.httpMethod === "DELETE") {
    try {
      if (DEBUG) console.log("DELETE request received");

      // Get choice ID from path parameters
      const { id: choiceId, error: pathError, statusCode: pathStatusCode, headers: pathHeaders, body: pathBody } = getPathId(event, "choices");
      if (pathError) {
        return { statusCode: pathStatusCode, headers: pathHeaders, body: pathBody };
      }

      // Delete choice
      const { error } = await db.deleteChoice(userId, choiceId);

      if (error) {
        throw error;
      }

      return {
        statusCode: 200,
        headers: { ...CORS_HEADERS(event) },
        body: JSON.stringify({ message: "Choice deleted successfully" }),
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
