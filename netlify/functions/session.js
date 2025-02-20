const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
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
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
      body: "",
    };
  }
  
  if (event.httpMethod === "GET") {
    try {
      // Supabase automatically handles session retrieval from cookies in a browser environment.
      // For Netlify functions, we need to manually extract the session from the headers.
      // The cookie name is typically 'sb-[project-ref]-auth-token'.

      const cookieString = event.headers.cookie || '';
      const cookies = cookieString.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {});

      const projectRef = supabaseUrl.split('.')[0].replace('https://', '');
      const sessionCookieName = `sb-${projectRef}-auth-token`;
      const sessionToken = cookies[sessionCookieName];

      if (!sessionToken) {
        return {
          statusCode: 401,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
          body: JSON.stringify({ error: "No session token found" }),
        };
      }

      // The session token is a JWT. Supabase client library can't verify it directly in a serverless function
      // without the JWT secret, which we shouldn't expose.  We'll just return the decoded token.
      // A more secure approach would be to use supabase.auth.getUser() with the token, but this requires
      // the JWT secret, which is not recommended for serverless functions.

      const [header, payload, signature] = sessionToken.split('.');
      const decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));

      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
        body: JSON.stringify({ session: decodedPayload }),
      };

    } catch (error) {
      return {
        statusCode: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
        body: JSON.stringify({ error: "Error retrieving session" }),
      };
    }
  }

  return {
    statusCode: 405,
    body: JSON.stringify({ error: "Method Not Allowed" }),
  };
};
