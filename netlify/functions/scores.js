const { createSupabaseClient, getAuthenticatedUser } = require("../../utils/supabaseClient");
const { CORS_HEADERS } = require("../../utils/CORS_HEADERS");

const DEBUG = true;

// Handle PUT requests (Update a score)
const handleUpdateScore = async (supabase, body, userId) => {

  const { criteria_id, choice_id, score } = JSON.parse(body);

  if (!criteria_id || !choice_id || score === undefined || userId === undefined) {
    throw new Error('Invalid request body: criteria_id, choice_id, score and userId are required');
  }

  if (score < 1 || score > 5) {
    throw new Error('Invalid score: Score must be between 1 and 5');
  }

  const { data, error } = await supabase
    .from('scores')
    .upsert({ criteria_id, choice_id, score, userId }, { onConflict: 'criteria_id,choice_id' })
    .select();

  if (error) throw new Error('Failed to update score: ' + error.message);
  return data[0];
};

exports.handler = async (event) => {
  try {

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  
    if (DEBUG) console.log(`${event.httpMethod} request received`);

    // Handle OPTIONS preflight request
    if (event.httpMethod === 'OPTIONS') {
      return { statusCode: 204, headers: { ...CORS_HEADERS(event) }, body: '' };
    }

    const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);
    const user = await getAuthenticatedUser(supabase);
    const userId = user?.id; // Ensure userId is defined
    if (!userId) throw new Error("User ID is missing");

    // Handle different request types
    let responseData;
    let statusCode = 200;
    switch (event.httpMethod) {
      case 'PUT':
        responseData = await handleUpdateScore(supabase, event.body, userId);
        break;
      default:
        throw new Error('Method Not Allowed');
    }

    return {
      statusCode: statusCode,
      headers: { ...CORS_HEADERS(event) },
      body: JSON.stringify(responseData),
    };
  } catch (error) {
    if (DEBUG) console.error('Error:', error.message);
    return {
      statusCode: error.message.startsWith('Unauthorized') ? 401 : 500,
      headers: { ...CORS_HEADERS(event) },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
