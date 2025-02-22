module.exports.getSessionToken = function (event) {
  // Ensure headers object exists and handle different header cases
  const headers = event?.headers || {};
  
  // Try different header cases for Authorization
  const authHeader = headers.authorization || headers.Authorization;
  if (authHeader) {
    const match = authHeader.match(/^Bearer (.+)$/);
    if (match) {
      return match[1]; // Return the token from the header
    }
  }

  // Fallback to checking cookies
  const cookieString = headers.cookie || headers.Cookie || '';
  const cookies = cookieString.split('; ').reduce((acc, cookie) => {
    const [key, ...valueParts] = cookie.split('=');
    acc[key] = valueParts.join('=');
    return acc;
  }, {});

  const projectRef = process.env.SUPABASE_URL?.split('.')[0].replace('https://', '') || '';
  const sessionCookieName = `sb-${projectRef}-auth-token`;

  return cookies[sessionCookieName] || null;
};
