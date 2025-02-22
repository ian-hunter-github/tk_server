const { createClient } = require('@supabase/supabase-js');
const { getSessionToken } = require('../../utils/getSessionToken'); // ✅ Use shared utility
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

  // ✅ Get session token securely
  const sessionToken = getSessionToken(event);
  if (!sessionToken) {
    if (DEBUG) console.log("No session token found");
    return {
      statusCode: 401,
      headers: { ...CORS_HEADERS(event) },
      body: JSON.stringify({ error: "Unauthorized" }),
    };
  }

  // ✅ Securely retrieve user from Supabase
  const { data: user, error } = await supabase.auth.getUser(sessionToken);
  if (error || !user) {
    if (DEBUG) console.log("Invalid session token");
    return {
      statusCode: 401,
      headers: { ...CORS_HEADERS(event) },
      body: JSON.stringify({ error: "Invalid session token" }),
    };
  }

  const userId = user.id; // ✅ Secure user ID extraction

  // ✅ Extract the path
  const path = event.rawPath.replace('/.netlify/functions/ai', ''); // More robust path extraction

  if (event.httpMethod === "POST") {
    if (path === '/generate-criteria') {
      try {
        const { concept } = JSON.parse(event.body);
        if (DEBUG) console.log("Generating criteria for:", concept);

        // Placeholder response (replace with actual AI logic)
        return {
          statusCode: 200,
          headers: { ...CORS_HEADERS(event) },
          body: JSON.stringify({ criteria: [`Criteria 1 for ${concept}`, `Criteria 2 for ${concept}`] }),
        };
      } catch (error) {
        console.error("Error processing request:", error);
        if (DEBUG) console.log("Error processing request:", error);
        return {
          statusCode: 400,
          headers: { ...CORS_HEADERS(event) },
          body: JSON.stringify({ error: "Invalid request data" }),
        };
      }
    } 

    else if (path === '/evaluate-alternative') {
      try {
        const { alternative, criteria } = JSON.parse(event.body);
        if (DEBUG) console.log("Evaluating alternative:", alternative, "with criteria:", criteria);

        let totalScore = 0;
        for (const criterion of criteria) {
          if (criterion.score < 1 || criterion.score > 5 || criterion.weight < 1 || criterion.weight > 10) {
            if (DEBUG) console.log("Invalid criterion:", criterion);
            return {
              statusCode: 400,
              headers: { ...CORS_HEADERS(event) },
              body: JSON.stringify({ error: `Invalid criterion: ${criterion.name}` }),
            };
          }
          totalScore += criterion.score * criterion.weight;
        }

        return {
          statusCode: 200,
          headers: { ...CORS_HEADERS(event) },
          body: JSON.stringify({ evaluation: totalScore }),
        };
      } catch (error) {
        console.error("Error processing request:", error);
        if (DEBUG) console.log("Error processing request:", error);
        return {
          statusCode: 400,
          headers: { ...CORS_HEADERS(event) },
          body: JSON.stringify({ error: "Invalid request data" }),
        };
      }
    } 

    else if (path === '/predict-scores') {
      try {
        const { alternative, newCriteria, existingCriteria } = JSON.parse(event.body);
        if (DEBUG) console.log("Predicting scores for:", alternative, "with new criteria:", newCriteria, "and existing criteria:", existingCriteria);

        // Placeholder response (replace with actual AI logic)
        return {
          statusCode: 200,
          headers: { ...CORS_HEADERS(event) },
          body: JSON.stringify({ prediction: `Prediction for ${alternative} with new criteria ${newCriteria.join(', ')} and existing criteria ${existingCriteria.join(', ')}` }),
        };
      } catch (error) {
        console.error("Error processing request:", error);
        if (DEBUG) console.log("Error processing request:", error);
        return {
          statusCode: 400,
          headers: { ...CORS_HEADERS(event) },
          body: JSON.stringify({ error: "Invalid request data" }),
        };
      }
    } 

    else {
      if (DEBUG) console.log("Endpoint not found");
      return {
        statusCode: 404,
        headers: { ...CORS_HEADERS(event) },
        body: JSON.stringify({ error: "Endpoint not found" }),
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
