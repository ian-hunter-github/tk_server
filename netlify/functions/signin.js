const cookie = require("cookie");
const { getDatabaseInstance } = require('../../utils/dbFactory.js');
const { CORS_HEADERS } = require("../../utils/CORS_HEADERS");

// Debug flag
const DEBUG = false;

exports.handler = async (event) => {

  if (DEBUG) console.log("[SignIn] Handler invoked");

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: { ...CORS_HEADERS(event) },
      body: "",
    };
  }

  const db = getDatabaseInstance();

  if (event.httpMethod === "POST") {
    try {

      const { email, password } = JSON.parse(event.body);

      if (DEBUG) console.log("[SignIn] POST with Params: ", email, password);

      const { data: signInData, error } = await db.signIn(email, password);

      if (DEBUG) console.log("[SignIn] SB Returns AccessToken: ", signInData?.user?.access_token, error);

      if (error) {
        return {
          statusCode: error.status || 500,
          headers: { ...CORS_HEADERS(event) },
          body: JSON.stringify({ error: error.message || "Supabase signin error" }),
        };
      }

      if (DEBUG) console.log("[SignIn] SB Returns AccessToken: ", signInData?.session?.access_token, error);

      const cookieString = cookie.serialize("sb-auth-token", signInData.session.access_token, {
        httpOnly: true,
        secure: true, // Always set secure to true
        sameSite: "None",
        maxAge: signInData.session.expires_in,
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
          user: { email: signInData.user.email, id: signInData.user.id, accessToken: signInData.session.access_token },
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
