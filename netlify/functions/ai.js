const { createClient } = require('@supabase/supabase-js');

// Helper function to get the session token from cookies
function getSessionToken() {
    const cookies = document.cookie.split("; ").reduce((acc, cookie) => {
      const [key, ...valueParts] = cookie.split("="); // Handle values containing '='
      acc[key] = valueParts.join("="); // Join parts back to reconstruct the full token
      return acc;
    }, {});
  
    const projectRef = process.env.SUPABASE_URL.split('.')[0].replace('https://', '');
    const sessionCookieName = `sb-${projectRef}-auth-token`;
    return cookies[sessionCookieName] || null;
}

exports.handler = async (event) => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
      body: JSON.stringify({ error: "Supabase environment variables not set" }),
    };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

    if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
      body: "",
    };
  }

  if (event.httpMethod === "POST") {
    const sessionToken = getSessionToken(event);

    if (!sessionToken) {
      return {
        statusCode: 401,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
        body: JSON.stringify({ error: "Unauthorized" }),
      };
    }

    // Since we cannot use supabase.auth.getUser() without JWT secret, we will
    // just check for the presence of a token and assume it is valid for now.
    // TODO: Implement proper authorization using a custom JWT verifier or a separate auth service.

    const path = event.path.replace('/.netlify/functions/ai', ''); // Extract the path

    if (path === '/generate-criteria') {
      // TODO: Implement generateCriteria logic
      const { concept } = JSON.parse(event.body);
      console.log("concept", concept)

      // Placeholder response
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
        body: JSON.stringify({ criteria: [`Criteria 1 for ${concept}`, `Criteria 2 for ${concept}`] }),
      };

    } else if (path === '/evaluate-alternative') {
      // TODO: Implement evaluateAlternative logic.  Criteria should have score (1-5) and weight (1-10)
      const { alternative, criteria } = JSON.parse(event.body);

      let totalScore = 0;
      for (const criterion of criteria) {
        if (criterion.score < 1 || criterion.score > 5) {
          return {
            statusCode: 400,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "POST, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type, Authorization",
            },
            body: JSON.stringify({ error: `Invalid score for criterion ${criterion.name}: ${criterion.score}` }),
          };
        }
        if (criterion.weight < 1 || criterion.weight > 10) {
          return {
            statusCode: 400,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "POST, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type, Authorization",
            },
            body: JSON.stringify({ error: `Invalid weight for criterion ${criterion.name}: ${criterion.weight}` }),
          };
        }
        totalScore += criterion.score * criterion.weight;
      }

      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
        body: JSON.stringify({ evaluation: totalScore }),
      };

    } else if (path === '/predict-scores') {
      // TODO: Implement predictScores logic
      const { alternative, newCriteria, existingCriteria } = JSON.parse(event.body);
      console.log("alternative", alternative)
      console.log("newCriteria", newCriteria)
      console.log("existingCriteria", existingCriteria)

      // Placeholder response
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
        body: JSON.stringify({ prediction: `Prediction for ${alternative} with new criteria ${newCriteria.join(', ')} and existing criteria ${existingCriteria.join(', ')}` }),
      };
    } else {
      return {
        statusCode: 404,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
        body: JSON.stringify({ error: "Endpoint not found" }),
      };
    }
  }

  return {
    statusCode: 405,
    body: JSON.stringify({ error: "Method Not Allowed" }),
  };
};
