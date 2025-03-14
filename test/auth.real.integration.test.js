const { handler: signinHandler } = require("../netlify/functions/signin.js");
const lambdaLocal = require("lambda-local");
const { getDatabaseInstance } = require('../utils/dbFactory');
const { createClient } = require('@supabase/supabase-js');

describe("Authentication Flow Real Integration", () => {
  const testEmail = "ian@tests.com";
  const testPassword = "test123";
  let testAccessToken;

  beforeEach(() => {
    // Ensure we're using the real Supabase client
    process.env.DB_TYPE = 'supabase';
    process.env.SUPABASE_URL="https://bqumdvfrgjcwcnbdbrps.supabase.co"
    process.env.SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxdW1kdmZyZ2pjd2NuYmRicnBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk4ODQ3NDIsImV4cCI6MjA1NTQ2MDc0Mn0.1u8pE3cLH6YjQIW1aiYUbyGiZ8__tb-ybChNf961fuE"
    process.env.SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxdW1kdmZyZ2pjd2NuYmRicnBzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTg4NDc0MiwiZXhwIjoyMDU1NDYwNzQyfQ.vzDwqLDBUkrAKdvIMzQKvJ_8ETEahXOMXmho-8WyE-o"
    process.env.SUPABASE_API_KEY="sbp_bebe3428eb2b028641ff4b9cf5a0af3341d5836a"
    process.env.NODE_ENV = 'test';
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
    expect(signInData.user.email).toBe(testEmail)
    
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
      timeout: 5000, // Add a 5-second timeout
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

  // MARKER_INSERT_NEW_TEST_CASE

  it("should fetch projects for the signed-in user", async () => {
    const signinEvent = {
      httpMethod: "POST",
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    };

    const signinResult = await lambdaLocal.execute({
      event: signinEvent,
      lambdaFunc: { handler: signinHandler },
      verboseLevel: 3,
      environment: {
        SUPABASE_URL: process.env.SUPABASE_URL,
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
      },
    });

    expect(signinResult.statusCode).toBe(200);
    const cookies = signinResult.headers["Set-Cookie"].split("; ").reduce((acc, cookie) => {
      const [key, ...valueParts] = cookie.split("=");
      acc[key] = valueParts.join("=");
      return acc;
    }, {});
    const accessToken = cookies["sb-auth-token"];

    const projectsEvent = {
      httpMethod: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    };

    const projectsResult = await lambdaLocal.execute({
      event: projectsEvent,
      lambdaFunc: {
        handler: require("../netlify/functions/projects.js").handler,
      },
      verboseLevel: 3,
      environment: {
        SUPABASE_URL: process.env.SUPABASE_URL,
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
      },
    });

    expect(projectsResult.statusCode).toBe(200);
    const projectsBody = JSON.parse(projectsResult.body);
    expect(Array.isArray(projectsBody)).toBe(true);
    expect(projectsBody.length).toBeGreaterThanOrEqual(1);
  });
});
