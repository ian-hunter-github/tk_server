const { createSupabaseClient, getAuthenticatedUser } = require("../../utils/supabaseClient");
const { CORS_HEADERS } = require("../../utils/CORS_HEADERS");

const DEBUG = true;

// Handle GET requests (Retrieve all user's projects or a single project)
const handleGetProjects = async (supabase, userId, projectId) => {
  if (DEBUG) console.log("Fetching projects for user:", userId, "Project ID:", projectId);

  let query = supabase
    .from('projects')
    .select('*')
    .eq('created_by', userId);

  if (projectId) {
    query = query.eq('id', projectId).single();
  }

  const { data, error } = await query;
  if (error) throw new Error('Failed to fetch projects: ' + error.message);
  if (DEBUG) console.log("Fetched projects:", data);
  return data;
};

// Handle POST requests (Create a new project)
const handleCreateProject = async (supabase, userId, body) => {
  if (DEBUG) console.log("Creating project for user:", userId, "Payload:", body);

  const { title, description } = JSON.parse(body);
  if (!title) throw new Error('Project title is required');

  const { data, error } = await supabase
    .from('projects')
    .insert([{ title, description, created_by: userId }])
    .select();

  if (error) throw new Error('Failed to create project: ' + error.message);
  if (DEBUG) console.log("Project created:", data[0]);
  return data[0];
};

// Handle PUT requests (Update a project)
const handleUpdateProject = async (supabase, userId, projectId, body) => {
  if (DEBUG) console.log("Updating project:", projectId, "for user:", userId, "Payload:", body);

  const { title, description } = JSON.parse(body);
  if (!title) throw new Error('Project title is required');

  const { data, error } = await supabase
    .from('projects')
    .update({ title, description })
    .eq('id', projectId)
    .eq('created_by', userId)
    .select();

  if (error) throw new Error('Failed to update project: ' + error.message);
  if (data.length === 0) throw new Error('Project not found or user not authorized');
  if (DEBUG) console.log("Project updated:", data[0]);
  return data[0];
};

// Handle DELETE requests (Delete a project)
const handleDeleteProject = async (supabase, userId, projectId) => {
  if (DEBUG) console.log("Deleting project:", projectId, "for user:", userId);

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
    .eq('created_by', userId);

  if (error) throw new Error('Failed to delete project: ' + error.message);
  if (DEBUG) console.log("Project deleted successfully");
  return { message: 'Project deleted successfully' };
};

// Main handler function
exports.handler = async (event) => {
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  try {
    if (DEBUG) console.log(`Received ${event.httpMethod} request with path:`, event.path);
    if (DEBUG) console.log("Request body:", event.body);

    // Handle OPTIONS preflight request
    if (event.httpMethod === 'OPTIONS') {
      return { statusCode: 204, headers: { ...CORS_HEADERS(event) }, body: '' };
    }

    // Initialize Supabase client and authenticate user
    const supabase = createSupabaseClient(event);
    const user = await getAuthenticatedUser(supabase); // Ensure user is authenticated
    const userId = user.id;
    if (DEBUG) console.log("Authenticated user ID:", userId);

    const projectId = event.pathParameters?.id;
    if (DEBUG && projectId) console.log("Project ID from path:", projectId);

    // Handle different request types
    let responseData;
    let statusCode = 200;
    switch (event.httpMethod) {
      case 'GET':
        responseData = await handleGetProjects(supabase, userId, projectId);
        break;
      case 'POST':
        responseData = await handleCreateProject(supabase, userId, event.body);
        statusCode = 201;
        break;
      case 'PUT':
        if (!projectId) throw new Error('Project ID is required for updates');
        responseData = await handleUpdateProject(supabase, userId, projectId, event.body);
        break;
      case 'DELETE':
        if (!projectId) throw new Error('Project ID is required for deletion');
        responseData = await handleDeleteProject(supabase, userId, projectId);
        break;
      default:
        throw new Error('Method Not Allowed');
    }

    if (DEBUG) console.log("Response data:", responseData);

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
