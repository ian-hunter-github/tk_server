const { CORS_HEADERS } = require("../../utils/CORS_HEADERS");
const { getPathId } = require("../../utils/getPathId");
const { getDatabaseInstance } = require("../../utils/dbFactory.js");
const cookie = require("cookie");

// Debug flag
const DEBUG = true;

// Helper function to fetch projects
async function fetchProjects(db, userId, projectId = null) {
  if (DEBUG)
    console.log(
      "[projects] Fetching projects for user:",
      userId,
      "Project ID:",
      projectId
    );

  try {
    const { data: projects, error } = await db.fetchProjects(userId, projectId);

    if (error) {
      throw error;
    }

    if (DEBUG) console.log("[projects] Fetched projects:", projects);

    if (projectId && projects) {
      // Fetch related criteria and choices
      const { data: criteria, error: criteriaError } = await db.fetchCriteria(userId, projectId);
      if(criteriaError) {
        throw criteriaError;
      }
      console.log("[fetchProjects] Fetched criteria:", criteria);
      const { data: choices, error: choicesError } = await db.fetchChoices(userId, projectId);
      if(choicesError){
        throw choicesError;
      }
      console.log("[fetchProjects] Fetched choices:", choices);

      let scoresMap = {};
      if (choices.length > 0) {
        // Fetch scores for the project
        const choiceIds = choices.map((c) => c.id);
        console.log("[fetchProjects] Fetching scores with choice IDs:", choiceIds);
        const { data: scores, error: scoresError } = await db.fetchScores(choiceIds);
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
            totalScore += score * (criterion.weight || 0); // Ensure weight is defined
          });
        }
        return { ...choice, scores: choiceScores, total_score: totalScore };
      });

      // Add criteria and choices to the project data.
      return { ...projects, criteria, choices: updatedChoices };
    }

    return projects;
  } catch (error) {
    console.error("Error fetching project(s):", error);
    throw error;
  }
}

// Helper function to fetch criteria for a project
async function fetchCriteria(db, projectId, userId) {
    if (DEBUG) console.log("Fetching criteria for project:", projectId, "user:", userId);
  const { data, error } = await db.fetchCriteria(userId, projectId);

  if (error) {
    throw error;
  }
  if (DEBUG) console.log("Fetched criteria:", data);

  return data;
}

// Helper function to fetch choices for a project
async function fetchChoices(db, projectId, userId) {
  if (DEBUG)
    console.log("Fetching choices for project:", projectId, "user:", userId);
  const { data, error } = await db.fetchChoices(userId, projectId);

  if (error) {
    throw error;
  }

  if (DEBUG) console.log("Fetched choices:", data);
  return data;
}

// Helper function to create project
async function createProject(db, userId, payload) {
  if (DEBUG)
    console.log("Creating project for user:", userId, "Payload:", payload);

  const { data, error } = await db.createProject(userId, payload);

  if (error) {
    throw error;
  }

  if (DEBUG) console.log("Project created:", data);
  return data;
}

// Helper function to update project
async function updateProject(db, userId, projectId, payload) {
  if (DEBUG)
    console.log(
      "Updating project:",
      projectId,
      "for user:",
      userId,
      "Payload:",
      payload
    );

  const { data, error } = await db.updateProject(userId, projectId, payload);

  if (error) {
    throw error;
  }

  if (DEBUG) console.log("Project updated:", data);
  return data;
}

// Helper function to delete project
async function deleteProject(db, userId, projectId) {
  if (DEBUG) console.log("Deleting project:", projectId, "for user:", userId);

  const { error } = await db.deleteProject(userId, projectId);

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

        const db = getDatabaseInstance();

        const { data: { user }, error: authError } = await db.signIn(null, null, token);

        if (authError || !user) {
          console.error("Authentication error:", authError);
          throw new Error("Unauthorized: Could not authenticate user.");
        }

        const userId = user.id;
        let responseData;

        if (event.httpMethod === "GET") {
          responseData =
            typeof projectId !== "undefined"
              ? await fetchProjects(db, userId, projectId)
              : await fetchProjects(db, userId);
        } else if (event.httpMethod === "POST") {
          const createPayload = JSON.parse(event.body);
          if (!createPayload.title) {
            return {
              statusCode: 400,
              headers: { ...CORS_HEADERS(event) },
              body: JSON.stringify({ error: "Project title is required" }),
            };
          }
          responseData = await createProject(db, userId, createPayload);
        } else if (event.httpMethod === "PUT") {
          ({ id: projectId, error, statusCode, headers, body } = getPathId(
            event,
            "projects",
            true
          ));
          if (error) {
            return { statusCode, headers, body };
          }
          const updatePayload = JSON.parse(event.body);
          responseData = await updateProject(db, userId, projectId, updatePayload);
        } else if (event.httpMethod === "DELETE") {
          ({ id: projectId, error, statusCode, headers, body } = getPathId(
            event,
            "projects",
            true
          ));
          if (error) {
            return { statusCode, headers, body };
          }
          responseData = await deleteProject(db, userId, projectId);
        }

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
