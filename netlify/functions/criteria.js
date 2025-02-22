const { createSupabaseClient, getAuthenticatedUser } = require("../../utils/supabaseClient");
const { CORS_HEADERS } = require("../../utils/CORS_HEADERS");

const DEBUG = true;

// Handle GET requests (Retrieve criteria for a project)
const handleGetCriteria = async (supabase, projectId) => {
  const { data, error } = await supabase
    .from('criteria')
    .select('*')
    .eq('project_id', projectId);
  if (error) throw new Error('Failed to fetch criteria: ' + error.message);
  return data;
};

// Handle POST requests (Create new criteria)
const handleCreateCriteria = async (supabase, body) => {
    const { project_id, criteria } = JSON.parse(body)

    if (!project_id || !criteria || !Array.isArray(criteria)) {
        throw new Error('Invalid request body: project_id and criteria array are required');
    }

    const formattedCriteria = criteria.map(({ definition, weight }) => ({
        project_id,
        definition,
        weight
    }));

    const { data, error } = await supabase
        .from('criteria')
        .insert(formattedCriteria)
        .select();

    if (error) throw new Error('Failed to create criteria: ' + error.message);
    return data;
};

// Handle PUT requests (Update a criterion)
const handleUpdateCriteria = async (supabase, criterionId, body) => {
  const { definition, weight } = JSON.parse(body);

  if (!definition || weight === undefined) {
    throw new Error('Invalid request body: definition and weight are required');
  }

  const { data, error } = await supabase
    .from('criteria')
    .update({ definition, weight })
    .eq('id', criterionId)
    .select();

  if (error) throw new Error('Failed to update criterion: ' + error.message);
  if (data.length === 0) throw new Error('Criterion not found');
  return data[0];
};

// Handle DELETE requests (Delete a criterion)
const handleDeleteCriteria = async (supabase, criterionId) => {
  const { error } = await supabase
    .from('criteria')
    .delete()
    .eq('id', criterionId);

  if (error) throw new Error('Failed to delete criterion: ' + error.message);
  return { message: 'Criterion deleted successfully' };
};

exports.handler = async (event) => {

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  try {
    if (DEBUG) console.log(`${event.httpMethod} request received`);

    // Handle OPTIONS preflight request
    if (event.httpMethod === 'OPTIONS') {
      return { statusCode: 204, headers: { ...CORS_HEADERS(event) }, body: '' };
    }

    // Initialize Supabase client and authenticate user
    const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);
    await getAuthenticatedUser(supabase); // Ensure user is authenticated

    let projectId;
    const criterionId = event.pathParameters?.id;

    // Handle different request types
    let responseData;
    let statusCode = 200;
    switch (event.httpMethod) {
      case 'GET':
        projectId = event.queryStringParameters.projectId;
        if (!projectId) throw new Error('Project ID is required');
        responseData = await handleGetCriteria(supabase, projectId);
        break;
      case 'POST':
        projectId = JSON.parse(event.body).project_id; // Get projectId from body
        if (!projectId) throw new Error('Project ID is required in body');
        responseData = await handleCreateCriteria(supabase, event.body);
        statusCode = 201;
        break;
      case 'PUT':
        if (!criterionId) throw new Error('Criterion ID is required for updates');
        responseData = await handleUpdateCriteria(supabase, criterionId, event.body);
        break;
      case 'DELETE':
        if (!criterionId) throw new Error('Criterion ID is required for deletion');
        responseData = await handleDeleteCriteria(supabase, criterionId);
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
