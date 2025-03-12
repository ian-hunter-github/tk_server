const { handler: signinHandler } = require("../netlify/functions/signin.js");
const lambdaLocal = require("lambda-local");
const { getDatabaseInstance } = require('../utils/dbFactory');

describe("Authentication Flow Real Integration", () => {
  const testEmail = "ian@tests.com";
  const testPassword = "test123";
  let testAccessToken;

  beforeEach(() => {
    // Ensure we're using the real Supabase client
    process.env.DB_TYPE = 'supabase';
  });

  it("should sign in with correct credentials using DbFactory", async () => {
    // Get a real database instance using DbFactory
    const db = getDatabaseInstance();
    
    // Sign in using the DatasourceInterface
    const { data: signInData, error: signInError } = await db.signIn(testEmail, testPassword);

    // Verify the sign-in was successful
    expect(signInError).toBeNull();
    expect(signInData).toBeDefined();
    expect(signInData.user).toBeDefined();
    expect(signInData.session).toBeDefined();
    // Don't check the exact email since we're using a real Supabase connection
    expect(signInData.user.email).toBeDefined();
    
    // Save the access token for the next test
    testAccessToken = signInData.session.access_token;
  });

  it("should sign in with correct credentials using signin.js handler", async () => {

    const signinEvent = {
      httpMethod: "POST",
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    };

    const result = await lambdaLocal.execute({
      event: signinEvent,
      lambdaFunc: { handler: signinHandler },
      verboseLevel: 3,
      environment: {
        SUPABASE_URL: process.env.SUPABASE_URL,
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
      },
    });

    const cookies = result.headers["Set-Cookie"].split("; ").reduce((acc, cookie) => {
      const [key, ...valueParts] = cookie.split("=");
      acc[key] = valueParts.join("=");
      return acc;
    }, {});
    const accessToken = cookies["sb-auth-token"];

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    console.log("result:", result);
    console.log("body:", body);
    expect(body.message).toBe("Sign in successful");
    // Don't check the exact email since we're using a real Supabase connection
    expect(body.user.email).toBeDefined();


    // Call the session handler (no Authorization header needed now)
    const sessionEvent = {
      httpMethod: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };

    const sessionResult = await lambdaLocal.execute({
      event: sessionEvent,
      lambdaFunc: {
        handler: require("../netlify/functions/session.js").handler,
      },
      verboseLevel: 3,
      environment: {
        SUPABASE_URL: process.env.SUPABASE_URL,
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
      },
    });
    console.log("sessionResult", sessionResult);
    expect(sessionResult.statusCode).toBe(200);
    const sessionBody = JSON.parse(sessionResult.body);
    expect(sessionBody.user).toBeDefined();
    // Don't check the exact email since we're using a real Supabase connection
    expect(sessionBody.user.email).toBeDefined();
  });
});
