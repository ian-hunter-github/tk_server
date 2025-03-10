const { handler: signinHandler } = require('../../netlify/functions/signin.js');
const cookie = require('cookie');

const signInAndGetToken = async (email, password) => {
  const signinEvent = {
    httpMethod: 'POST',
    body: JSON.stringify({
      email,
      password,
    }),
  };

  const response = await signinHandler(signinEvent);

  if (response.statusCode !== 200) {
      console.log("signin response", response)
    throw new Error('Sign-in failed');
  }

  const cookies = cookie.parse(response.headers['Set-Cookie']);
  return cookies['sb-auth-token'];
};

const mockAuthMiddleware = async (req, res, next) => {
  req.userId = '1'; // Set a consistent user ID for testing
  return next();
};

module.exports = { signInAndGetToken, mockAuthMiddleware };
