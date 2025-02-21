module.exports.getSessionToken = function (event) {
  // Check for Authorization header
  const authHeader = event.headers.authorization;
  if (authHeader) {
    const match = authHeader.match(/^Bearer (.+)$/);
    if (match) {
      return match[1]; // Return the token from the header
    }
  }

  // Fallback to checking cookies
  const cookieString = event.headers.cookie || '';
  const cookies = cookieString.split('; ').reduce((acc, cookie) => {
    const [key, ...valueParts] = cookie.split('=');
    acc[key] = valueParts.join('=');
    return acc;
  }, {});

  const projectRef = process.env.SUPABASE_URL.split('.')[0].replace('https://', '');
  const sessionCookieName = `sb-${projectRef}-auth-token`;

  return cookies[sessionCookieName] || null;
};
