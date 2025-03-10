const { createClient } = require("@supabase/supabase-js");
const { CORS_HEADERS } = require("../../utils/CORS_HEADERS");
const { getPathId } = require("../../utils/getPathId");
const cookie = require("cookie");

// Debug flag
const DEBUG = true;

// Helper function to fetch projects
async function fetchProjects(supabase, userId, projectId = null) {
  if (DEBUG)
    console.log(
      "[projects] Fetching projects for user:",
      userId,
      "Project ID:",
      projectId
    );

  let query = supabase.from("projects").select("*");

  if (projectId) {
    query = query.eq("id", projectId).eq("created_by", userId).single();
  } else {
    query = query.eq("created_by", userId);
  }

  try {
    const { data, error } = await query;
    if (error) {
      throw error;
    }
    if (DEBUG) console.log("[projects] Fetched projects:", data);

    if (projectId && data) {
      // Fetch related criteria and choices
      const criteria = await fetchCriteria(supabase, projectId, userId);
      console.log("[fetchProjects] Fetched criteria:", criteria);
      const choices = await fetchChoices(supabase, projectId, userId);
      console.log("[fetchProjects] Fetched choices:", choices);

      let scoresMap = {};
      if (choices.length > 0) {
        // Fetch scores for the project
        console.log("[fetchProjects] Fetching scores with choice IDs:", choices.map((c) => c.id));
        const { data: scores, error: scoresError } = await supabase
          .from("scores")
          .select("*")
          .in(
            "choice_id",
            choices.map((c) => c.id)
          ); // Efficiently fetch only relevant scores
        console.log("[fetchProjects] Fetched scores:", scores);

        if (scoresError) {
          throw scoresError;
        }

        // Create a map for efficient score lookup
        scores.forEach((score) => {
          scoresMap[`${score.choice_id}_${score.criteria_id}`] = score.score;
        });
      }

      console.log("[fetchProjects] scoresMap:", scoresMap);
      // Attach scores to choices and calculate total score
      const updatedChoices = choices.map((choice) => {
        console.log("[fetchProjects] Processing choice:", choice);
        let totalScore = 0;
        const choiceScores = {};
        if (criteria.length > 0) {
          criteria.forEach((criterion) => {
            console.log("[fetchProjects] Processing criterion:", criterion);
            const score = scoresMap[`${choice.id}_${criterion.id}`] || 0;
            choiceScores[criterion.id] = score;
            totalScore += score * criterion.weight;
          });
        }
        return { ...choice, scores: choiceScores, total_score: totalScore };
      });

      // Add criteria and choices to the project data.  Return object not array
      return { ...data, criteria, choices: updatedChoices };
    }

    return data;
  } catch (error) {
    console.error("Error fetching project(s):", error);
    throw error;
  }
}

// Helper function to fetch criteria for a project
async function fetchCriteria(supabase, projectId, userId) {
  if (DEBUG)
    console.log("Fetching criteria for project:", projectId, "user:", userId);
  const { data, error } = await supabase
    .from("criteria")
    .select("*")
    .eq("project_id", projectId)
    .eq("created_by", userId);

  if (error) {
    throw error;
  }
  if (DEBUG) console.log("Fetched criteria:", data);

  return data;
}

// Helper function to fetch choices for a project
async function fetchChoices(supabase, projectId, userId) {
  if (DEBUG)
    console.log("Fetching choices for project:", projectId, "user:", userId);
  const { data, error } = await supabase
    .from("choices")
    .select("*")
    .eq("project_id", projectId)
    .eq("created_by", userId);

  if (error) {
    throw error;
  }

  if (DEBUG) console.log("Fetched choices:", data);
  return Array.isArray(data) ? data : [data].filter(Boolean);
}

// Helper function to create project
async function createProject(supabase, userId, payload) {
  if (DEBUG)
    console.log("Creating project for user:", userId, "Payload:", payload);

  const { data, error } = await supabase
    .from("projects")
    .insert({ ...payload, created_by: userId })
    .select()
    .single();

  if (error) {
    throw error;
  }

  if (DEBUG) console.log("Project created:", data);
  return data;
}

// Helper function to update project
async function updateProject(supabase, userId, projectId, payload) {
  if (DEBUG)
    console.log(
      "Updating project:",
      projectId,
      "for user:",
      userId,
      "Payload:",
      payload
    );

  const { data, error } = await supabase
    .from("projects")
    .update(payload)
    .eq("id", projectId)
    .eq("created_by", userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  if (DEBUG) console.log("Project updated:", data);
  return data;
}

// Helper function to delete project
async function deleteProject(supabase, userId, projectId) {
  if (DEBUG) console.log("Deleting project:", projectId, "for user:", userId);

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId)
    .eq("created_by", userId);

  if (error) {
    throw error;
  }

  if (DEBUG) console.log("Project deleted successfully");
  return { message: "Project deleted successfully" };
}

exports.handler = async (event) => {
  try {
    if (DEBUG) {
      console.log("[projects] Received", event);
      console.log("[projects] CORS_HEADERS:", CORS_HEADERS(event));
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase environment variables not set");
    }

    // Get project ID from path parameters if present
    let {
      id: projectId,
      error,
      statusCode,
      headers,
      body,
    } = getPathId(event, "projects");

    if (error) {
      return { statusCode, headers, body };
    }

    // Handle different HTTP methods
    switch (event.httpMethod) {
      case "OPTIONS":
        return {
          statusCode: 204,
          headers: { ...CORS_HEADERS(event) },
          body: "",
        };
      case "GET":
      case "POST":
      case "PUT":
      case "DELETE":
        // Extract the token from the cookie
        const cookies = cookie.parse(event.headers.cookie || "");
        const token = cookies["sb-auth-token"];

        if (!token) {
          throw new Error("Unauthorized: No token provided");
        }

        console.log("Auth Header:", event.headers.authorization);
        console.log("[projects] event:", event);
        console.log("[projects] cookies:", cookies);
        console.log("[projects] token:", token);

        // Use default client, don't pass in authorization header
        //const supabase = createClient(supabaseUrl, supabaseAnonKey);
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: `Bearer ${token}` } }
        });
        
        // Supabase Server-side Auth Helpers: https://supabase.com/docs/guides/auth/server-side/creating-a-client?environment=netlify-functions
        // Use getUser with the JWT directly
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser(token);
        console.log("[projects] getUser result:", { user, userError });

        if (userError || !user) {
          console.error("Error getting user:", userError);
          throw new Error("Unauthorized: Could not retrieve user.");
        }
        const userId = user.id;

        let responseData;

        if (event.httpMethod === "GET") {
          // Explicitly check for projectId being undefined
          responseData =
            typeof projectId !== "undefined"
              ? await fetchProjects(supabase, userId, projectId)
              : await fetchProjects(supabase, userId);
        } else if (event.httpMethod === "POST") {
          const createPayload = JSON.parse(event.body);
          if (!createPayload.title) {
            throw new Error("Project title is required");
          }
          responseData = await createProject(supabase, userId, createPayload);
        } else if (event.httpMethod === "PUT") {
          // Get project ID from path parameters, mandatory for PUT
          ({ id: projectId, error, statusCode, headers, body } = getPathId(
            event,
            "projects",
            true
          ));
          if (error) {
            return { statusCode, headers, body };
          }
          const updatePayload = JSON.parse(event.body);
          responseData = await updateProject(
            supabase,
            userId,
            projectId,
            updatePayload
          );
        } else if (event.httpMethod === "DELETE") {
          // Get project ID from path parameters, mandatory for DELETE
          ({ id: projectId, error, statusCode, headers, body } = getPathId(
            event,
            "projects",
            true
          ));
           if (error) {
            return { statusCode, headers, body };
          }
         responseData = await deleteProject(supabase, userId, projectId);
        }

        if (DEBUG) console.log("[projects] Response data:", responseData);

        return {
          statusCode: event.httpMethod === "POST" ? 201 : 200,
          headers: { ...CORS_HEADERS(event) },
          body: JSON.stringify(responseData || { error: "No data returned" }), // Ensure response is never undefined
        };
      default:
        throw new Error("Method not allowed");
    }
  } catch (error) {
    console.error("Error:", error.message);
    if (DEBUG) console.log("[projects] Error:", error.message);
    return {
      statusCode: error.message.startsWith("Unauthorized") ? 401 : 500,
      headers: { ...CORS_HEADERS(event) },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
