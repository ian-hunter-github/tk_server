const { createSupabaseClient, getAuthenticatedUser } = require("../../utils/supabaseClient");
const { CORS_HEADERS } = require("../../utils/CORS_HEADERS");

const DEBUG = true;

// Handle GET requests (Retrieve choices for a project)
const handleGetChoices = async (supabase, projectId) => {
  const { data, error } = await supabase
    .from('choices')
    .select('*')
    .eq('project_id', projectId);
  if (error) throw new Error('Failed to fetch choices: ' + error.message);
  return data;
};

// Handle POST requests (Create new choices)
const handleCreateChoices = async (supabase, body, userId) => {
  const { project_id, choices } = JSON.parse(body);

  if (!project_id || !choices || !Array.isArray(choices)) {
    throw new Error('Invalid request body: project_id and choices array are required');
  }

  const formattedChoices = choices.map(({ description, disqualified }) => ({
    project_id,
    description,
    disqualified: disqualified || false // Default to false if not provided
  }));

  const { data, error } = await supabase
    .from('choices')
    .insert(formattedChoices)
    .select();

  if (error) throw new Error('Failed to create choices: ' + error.message);
  return data;
};

// Handle PUT requests (Update a choice)
const handleUpdateChoice = async (supabase, choiceId, body, userId) => {
  const { description, disqualified } = JSON.parse(body);

  if (description === undefined && disqualified === undefined) {
    throw new Error('Invalid request body: at least one of description or disqualified must be provided');
  }

  const updateData = {};
  if (description !== undefined) {
      updateData.description = description;
  }
  if (disqualified !== undefined) {
      updateData.disqualified = disqualified;
  }

  const { data, error } = await supabase
    .from('choices')
    .update(updateData)
    .eq('id', choiceId)
    .select();

  if (error) throw new Error('Failed to update choice: ' + error.message);
  if (data.length === 0) throw new Error('Choice not found');
  return data[0];
};

// Handle DELETE requests (Delete a choice)
const handleDeleteChoice = async (supabase, choiceId) => {
  const { error } = await supabase
    .from('choices')
    .delete()
    .eq('id', choiceId);

  if (error) throw new Error('Failed to delete choice: ' + error.message);
  return { message: 'Choice deleted successfully' };
};

exports.handler = async (event) => {
  try {
    if (DEBUG) console.log(`${event.httpMethod} request received`);

    // Handle OPTIONS preflight request
    if (event.httpMethod === 'OPTIONS') {
      return { statusCode: 204, headers: { ...CORS_HEADERS(event) }, body: '' };
    }

    // Initialize Supabase client and authenticate user
    const supabase = createSupabaseClient(event);
    const userId = await getAuthenticatedUser(supabase); // Ensure user is authenticated

    let projectId;
    const choiceId = event.pathParameters?.id;

    // Handle different request types
    let responseData;
    let statusCode = 200;
    switch (event.httpMethod) {
      case 'GET':
        projectId = event.queryStringParameters.projectId;
        if (!projectId) throw new Error('Project ID is required');
        responseData = await handleGetChoices(supabase, projectId);
        break;
      case 'POST':
        projectId = JSON.parse(event.body).project_id; // Get projectId from body
        if (!projectId) throw new Error('Project ID is required in body');
        responseData = await handleCreateChoices(supabase, event.body, userId);
        statusCode = 201;
        break;
      case 'PUT':
        if (!choiceId) throw new Error('Choice ID is required for updates');
        responseData = await handleUpdateChoice(supabase, choiceId, event.body, userId);
        break;
      case 'DELETE':
        if (!choiceId) throw new Error('Choice ID is required for deletion');
        responseData = await handleDeleteChoice(supabase, choiceId, userId);
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
