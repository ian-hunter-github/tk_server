const { createClient } = require("@supabase/supabase-js");
const cookie = require("cookie");
const { CORS_HEADERS } = require("../../utils/CORS_HEADERS");

// Debug flag
const DEBUG = true;

exports.handler = async (event) => {

  if (DEBUG) console.log("[SignIn] Handler invoked");

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      statusCode: 500,
      headers: { ...CORS_HEADERS(event) },
      body: JSON.stringify({ error: "Supabase environment variables not set" }),
    };
  }

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: { ...CORS_HEADERS(event) },
      body: "",
    };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  if (event.httpMethod === "POST") {
    try {

      const { email, password } = JSON.parse(event.body);

      if (DEBUG) console.log("[SignIn] POST with Params: ", email, password);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (DEBUG) console.log("[SignIn] SB Returns AccessToken: ", data.session?.access_token, error);
        return {
          statusCode: error.status || 500,
          headers: { ...CORS_HEADERS(event) },
          body: JSON.stringify({ error: error.message || "Supabase signin error" }),
        };
      }

      if (DEBUG) console.log("[SignIn] SB Returns AccessToken: ", data.session.access_token, error);

      const cookieString = cookie.serialize("sb-auth-token", data.session.access_token, {
        httpOnly: true,
        secure: true, // Always set secure to true
        sameSite: "None",
        maxAge: data.session.expires_in,
        path: "/",
      });

      return {
        statusCode: 200,
        headers: {
          ...CORS_HEADERS(event),
          "Set-Cookie": cookieString,
          "Access-Control-Expose-Headers": "Set-Cookie, Authorization", // ✅ Allow browser access
        },
        body: JSON.stringify({
          message: "Sign in successful",
          user: { email: data.user.email, id: data.user.id, accessToken: data.session.access_token },
        }),
      };
    } catch (error) {
      console.log(error)
      return {
        statusCode: 400,
        headers: { ...CORS_HEADERS(event) },
        body: JSON.stringify({ error: "Invalid request" }),
      };
    }
  }

  return {
    statusCode: 405,
    headers: { ...CORS_HEADERS(event) },
    body: JSON.stringify({ error: "Method Not Allowed" }),
  };
};
