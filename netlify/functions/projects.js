const { CORS_HEADERS } = require("../../utils/CORS_HEADERS");
const { getPathId } = require("../../utils/getPathId");
const { getDatabaseInstance } = require("../../utils/dbFactory.js");
const cookie = require("cookie");

// Debug flag
const DEBUG = true;


// Helper function to fetch projects
async function fetchProjects(db, userId, projectId = null) {
    if (DEBUG) console.log("[projects] Fetching projects for user:", userId, "Project ID:", projectId);

    try {
        let projects;
        if (projectId) {
            // Fetch single project
            const { data, error } = await db.fetchProjectById(userId, projectId);
            if (error) {
                throw error;
            }
            projects = data ? [data] : []; // Wrap single project in an array, or empty array if null
        } else {
            // Fetch all projects
            if (DEBUG) console.log("[projects] Fetching all projects for user:", userId);
            const { data, error } = await db.fetchAllProjects(userId);
            if (DEBUG) console.log("[projects] Result from db.fetchAllProjects:", data, error);
            if (error) {
                throw error;
            }
            projects = data || []; // Ensure projects is an array even if data is null
        }

        if (DEBUG) console.log("[projects] Fetched projects:", projects);

        // Fetch related criteria, choices, and scores for each project
        const projectsWithDetails = await Promise.all(
            projects.map(async (project) => {
                const { data: criteria, error: criteriaError } = await db.fetchCriteria(userId, project.id);
                if (criteriaError) {
                    throw criteriaError;
                }
                if (DEBUG) console.log("[fetchProjects] Fetched criteria:", criteria);

                const { data: choices, error: choicesError } = await db.fetchChoices(userId, project.id);
                if (choicesError) {
                    throw choicesError;
                }
                if (DEBUG) console.log("[fetchProjects] Fetched choices:", choices);

                let scoresMap = {};
                if (choices && choices.length > 0) {
                    const choiceIds = choices.map((c) => c.id);
                    if (DEBUG) console.log("[fetchProjects] Fetching scores with choice IDs:", choiceIds);
                    const { data: scores, error: scoresError } = await db.fetchScores(choiceIds);
                    if (scoresError) {
                        throw scoresError;
                    }
                    if (DEBUG) console.log("[fetchProjects] Fetched scores:", scores);

                    scores.forEach((score) => {
                        scoresMap[`${score.choice_id}_${score.criteria_id}`] = score.score;
                    });
                }

                if (DEBUG) console.log("[fetchProjects] scoresMap:", scoresMap);

                const updatedChoices = (choices || []).map((choice) => {
                    if (DEBUG) console.log("[fetchProjects] Processing choice:", choice);
                    let totalScore = 0;
                    const choiceScores = {};
                    if(criteria && criteria.length > 0) {
                        criteria.forEach((criterion) => {
                            if (DEBUG) console.log("[fetchProjects] Processing criterion:", criterion);
                            const score = scoresMap[`${choice.id}_${criterion.id}`] || 0;
                            choiceScores[criterion.id] = score;
                            totalScore += score * (criterion.weight || 0);
                        });
                    }
                    return { ...choice, scores: choiceScores, total_score: totalScore };

                });

                return { ...project, criteria: criteria || [], choices: updatedChoices };
            })
        );

      return projectsWithDetails.length === 1 && projectId ? projectsWithDetails[0] : projectsWithDetails;

    } catch (error) {
        console.error("Error fetching project(s):", error);
        throw error;
    }
}


// Helper function to create project
async function createProject(db, userId, payload) {
  if (DEBUG)
    console.log("Creating project for user:", userId, "Payload:", payload);

  const { data, error } = await db.createProject(userId, payload);

  if (error) {
    console.error("Error creating project:", error); // Log the error
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
  // Handle OPTIONS requests immediately
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: { ...CORS_HEADERS(event) },
      body: "",
    };
  }

  try {
    if (DEBUG) {
      console.log("[projects] Received", event);
      console.log("[projects] CORS_HEADERS:", CORS_HEADERS(event));
    }

    console.log("[projects] process.env.NODE_ENV:", process.env.NODE_ENV); // Log NODE_ENV

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

    // Extract the token from the Authorization header or cookie
    let token = null;
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else {
      const cookies = cookie.parse(event.headers.cookie || "");
      token = cookies["sb-auth-token"];
    }

    // Don't throw an error if no token is provided. Let the db.getUser
    // function handle authentication failures for protected routes.

    // Handle different HTTP methods
    switch (event.httpMethod) {
      case "GET":
      case "POST":
      case "PUT":
      case "DELETE":
        const db = getDatabaseInstance();

        // Even if token is null, db.getUser will handle it
        const { data: { user }, error: authError } = await db.getUser(token);
        console.log("[projects] Result from db.getUser:", user, authError); // Log user and error

        if (authError || !user) {
          console.error("Authentication error:", authError);
          throw new Error("Unauthorized: Could not authenticate user.");
        }

        const userId = user.id;
        console.log("[projects] userId:", userId); // Log userId
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
