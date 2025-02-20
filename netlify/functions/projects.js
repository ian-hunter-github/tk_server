const { createClient } = require('@supabase/supabase-js');

// Helper function to get the session token from cookies
function getSessionToken(event) {
    const cookieString = event.headers.cookie || '';
    const cookies = cookieString.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
    }, {});

    const projectRef = process.env.SUPABASE_URL.split('.')[0].replace('https://', '');
    const sessionCookieName = `sb-${projectRef}-auth-token`;
    return cookies[sessionCookieName];
}

exports.handler = async (event) => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
      body: "",
    };
  }

  const sessionToken = getSessionToken(event);
  if (!sessionToken) {
    return {
      statusCode: 401,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
      body: JSON.stringify({ error: "Unauthorized" }),
    };
  }

    // Since we cannot use supabase.auth.getUser() without JWT secret, we will
    // just check for the presence of a token and assume it is valid for now.
    // TODO: Implement proper authorization using a custom JWT verifier or a separate auth service.
  
  if (event.httpMethod === "GET") {
    // TODO: Fetch projects associated with the user.
    // For now, returning a placeholder.
     try {
        const [header, payload, signature] = sessionToken.split('.');
        const decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
        const userId = decodedPayload.sub

        const { data: projects, error } = await supabase
            .from('projects')
            .select('*')
            .eq('user_id', userId);

        if (error) {
            throw error;
        }

      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
        body: JSON.stringify(projects),
      };
    } catch (error) {
        console.error("Error fetching projects:", error);
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
            },
            body: JSON.stringify({ error: "Failed to fetch projects" }),
        };
    }
  } else if (event.httpMethod === "POST") {
    try {
        const [header, payload, signature] = sessionToken.split('.');
        const decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
        const userId = decodedPayload.sub

      const { name, description, criteria } = JSON.parse(event.body);

      // TODO: Validate project data
      if (!name) {
        return {
          statusCode: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
          body: JSON.stringify({ error: "Project name is required" }),
        };
      }

      const { data: newProject, error } = await supabase
        .from('projects')
        .insert([
          { name, description, criteria, user_id: userId },
        ])
        .select();

      if (error) {
        throw error;
      }

      return {
        statusCode: 201,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
        body: JSON.stringify(newProject[0]),
      };
    } catch (error) {
      console.error("Error creating project:", error);
      return {
        statusCode: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
        body: JSON.stringify({ error: "Failed to create project" }),
      };
    }
  }

  return {
    statusCode: 405,
    body: JSON.stringify({ error: "Method Not Allowed" }),
  };
};
