const cookie = require("cookie");
const { CORS_HEADERS } = require("../../utils/CORS_HEADERS");

exports.handler = async (event) => {
  const cookieString = cookie.serialize("sb-auth-token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "None",
    expires: new Date(0), // Expire immediately
    path: "/",
  });

  return {
    statusCode: 200,
    headers: {
      ...CORS_HEADERS(event),
      "Set-Cookie": cookieString,
    },
    body: JSON.stringify({ message: "Sign out successful" }),
  };
};
