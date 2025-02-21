function CORS_HEADERS(event) {
  const allowedOrigins = [
    "http://localhost:3000",
    "https://ktfrontend.netlify.app"
  ];

  // Safely get the request origin
  const origin = event?.headers?.origin || "";

  // Allow the origin only if it's in the allowed list
  const isAllowedOrigin = allowedOrigins.includes(origin);

  return {
    "Access-Control-Allow-Origin": isAllowedOrigin ? origin : "", // Empty to avoid wildcard issues
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization", // Allow Authorization for token-based auth
    "Access-Control-Allow-Credentials": "true",
  };
}

module.exports = { CORS_HEADERS };
