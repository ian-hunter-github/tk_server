const { createClient } = require("@supabase/supabase-js");
const { CORS_HEADERS } = require("../../utils/CORS_HEADERS");
const { getSessionToken } = require('../../utils/getSessionToken');

// Debug flag
const DEBUG = true;

exports.handler = async (event) => {
    if (DEBUG) console.log("Handler invoked");

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        if (DEBUG) console.log("Supabase environment variables not set");
        return {
            statusCode: 500,
            headers: { ...CORS_HEADERS(event) },
            body: JSON.stringify({ error: "Supabase environment variables not set" }),
        };
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Handle OPTIONS preflight requests
    if (event.httpMethod === "OPTIONS") {
        if (DEBUG) console.log("OPTIONS request received");
        return {
            statusCode: 204,
            headers: { ...CORS_HEADERS(event) },
            body: "",
        };
    }

    if (event.httpMethod === "GET") {
        try {
            const sessionToken = getSessionToken(event);

            if (!sessionToken) {
                return {
                    statusCode: 401,
                    headers: { ...CORS_HEADERS(event) },
                    body: JSON.stringify({ error: "No session token found" }),
                };
            }

            const { data: user, error } = await supabase.auth.getUser(sessionToken);

            if (error) {
                return {
                    statusCode: 401,
                    headers: { ...CORS_HEADERS(event) },
                    body: JSON.stringify({ error: error.message }),
                };
            }

            return {
                statusCode: 200,
                headers: { ...CORS_HEADERS(event) },
                body: JSON.stringify({ session: user }),
            };

        } catch (error) {
            console.error('Error:', error);
            return {
                statusCode: 500,
                headers: { ...CORS_HEADERS(event) },
                body: JSON.stringify({ error: 'Failed to retrieve session data.' }),
            };
        }
    }

    if (DEBUG) console.log("Method not allowed");
    return {
        statusCode: 405,
        headers: { ...CORS_HEADERS(event) },
        body: JSON.stringify({ error: "Method Not Allowed" }),
    };
}
