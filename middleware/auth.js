const { createClient } = require("@supabase/supabase-js");
const cookie = require("cookie");
const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
  try {
    const cookies = cookie.parse(req.headers.cookie || '');
    const token = cookies['sb-auth-token'];

    if (!token) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Unauthorized: No token provided" }),
      };
    }

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET);
    req.userId = decoded.sub; // Attach the user ID to the request
    return next();

  } catch (error) {
    console.error("Auth middleware error:", error);
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "Unauthorized: Invalid token" }),
    };
  }
};

module.exports = { authMiddleware };
