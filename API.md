# Kepner-Tregoe Decision Analysis API Documentation

This document provides comprehensive documentation for the Kepner-Tregoe Decision Analysis API endpoints. These endpoints are implemented as Netlify serverless functions and interact with a Supabase backend.

## Authentication

### Sign Up
**Endpoint**: `POST /.netlify/functions/signup`  
Creates a new user account.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response (200)**:
```json
{
  "message": "Sign up successful",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com"
  }
}
```

**Headers**:  
None

**Notes**:
- The endpoint no longer automatically signs in the user.

### Sign In
**Endpoint**: `POST /.netlify/functions/signin`  
Authenticates a user and creates a session.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response (200)**:
```json
{
  "message": "Sign in successful",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com"
  }
}
```

**Headers**:  
Sets an HTTP-only cookie `sb-auth-token` containing the session token with the following attributes:
- `httpOnly`: true
- `secure`: true (in production)
- `sameSite`: "None"
- `maxAge`: session duration
- `path`: "/"

**Notes**:
- The `accessToken` is no longer returned in the response body. The cookie is the primary authentication method. The server automatically validates the session token from the cookie for protected routes.

### Sign Out
**Endpoint**: `POST /.netlify/functions/signout`  
Ends the current user session.

**Response (200)**:
```json
{
  "message": "Sign out successful"
}
```

**Headers**:  
Clears the `sb-auth-token` cookie.

## Projects

### List Projects
**Endpoint**: `GET /.netlify/functions/projects`  
Retrieves all projects for the authenticated user.

**Response (200)**:
```json
[
  {
    "id": "project-uuid",
    "title": "Project Title",
    "description": "Project Description",
    "created_by": "user-uuid",
    "created_at": "2025-02-24T14:00:00Z"
  }
]
```
**Notes**:
- The server automatically extracts the `userId` from the session token in the `sb-auth-token` cookie.

### Get Project
**Endpoint**: `GET /.netlify/functions/projects/:id`  
Retrieves a specific project by ID.

**Response (200)**:
```json
{
  "id": "project-uuid",
  "title": "Project Title",
  "description": "Project Description",
  "created_by": "user-uuid",
  "created_at": "2025-02-24T14:00:00Z",
    "criteria": [
        {
            "id": "criteria-uuid",
            "project_id": "project-uuid",
            "definition": "Criterion Definition",
            "weight": 3,
            "created_by": "user-uuid"
        }
    ],
    "choices": [
        {
            "id": "choice-uuid",
            "project_id": "project-uuid",
            "description": "Choice Description",
            "disqualified": false,
            "created_by": "user-uuid",
            "scores": {
                "criteria-uuid": 4
            },
            "total_score": 12
        }
    ]
}
```
**Notes**:
- The server automatically extracts the `userId` from the session token in the `sb-auth-token` cookie.
- Includes `criteria`, `choices`, and `scores` in the response.

### Create Project
**Endpoint**: `POST /.netlify/functions/projects`  
Creates a new project.

**Request Body**:
```json
{
  "title": "Project Title",
  "description": "Project Description"
}
```

**Response (201)**:
```json
{
  "id": "project-uuid",
  "title": "Project Title",
  "description": "Project Description",
  "created_by": "user-uuid",
  "created_at": "2025-02-24T14:00:00Z"
}
```
**Notes**:
- The server automatically extracts the `userId` from the session token in the `sb-auth-token` cookie.

### Update Project
**Endpoint**: `PUT /.netlify/functions/projects/:id`  
Updates an existing project.

**Request Body**:
```json
{
  "title": "Updated Title",
  "description": "Updated Description"
}
```

**Response (200)**:
```json
{
  "id": "project-uuid",
  "title": "Updated Title",
  "description": "Updated Description",
  "created_by": "user-uuid",
  "updated_at": "2025-02-24T14:00:00Z"
}
```
**Notes**:
- The server automatically extracts the `userId` from the session token in the `sb-auth-token` cookie.

### Delete Project
**Endpoint**: `DELETE /.netlify/functions/projects/:id`  
Deletes a project.

**Response (200)**:
```json
{
  "message": "Project deleted successfully"
}
```

## Criteria

### List Criteria
**Endpoint**: `GET /.netlify/functions/criteria`  
Retrieves criteria for a specific project.

**Query Parameters**:
- `projectId`: ID of the project

**Response (200)**:
```json
[
  {
    "id": "criteria-uuid",
    "project_id": "project-uuid",
    "definition": "Criterion Definition",
    "weight": 3,
    "created_by": "user-uuid"
  }
]
```
**Notes**:
- The server automatically extracts the `userId` from the session token in the `sb-auth-token` cookie.

### Create Criteria
**Endpoint**: `POST /.netlify/functions/criteria`  
Creates new criteria for a project.

**Request Body**:
```json
{
  "project_id": "project-uuid",
  "criteria": [
    {
      "definition": "Criterion Definition",
      "weight": 3
    }
  ]
}
```

**Response (201)**:
```json
[
  {
    "id": "criteria-uuid",
    "project_id": "project-uuid",
    "definition": "Criterion Definition",
    "weight": 3,
    "created_by": "user-uuid"
  }
]
```
**Notes**:
- The server automatically extracts the `userId` from the session token in the `sb-auth-token` cookie.


### Update Criterion
**Endpoint**: `PUT /.netlify/functions/criteria/:id`  
Updates an existing criterion.

**Request Body**:
```json
{
  "definition": "Updated Definition",
  "weight": 4
}
```

**Response (200)**:
```json
{
  "id": "criteria-uuid",
  "project_id": "project-uuid",
  "definition": "Updated Definition",
  "weight": 4,
   "created_by": "user-uuid"
}
```
**Notes**:
- The server automatically extracts the `userId` from the session token in the `sb-auth-token` cookie.

### Delete Criterion
**Endpoint**: `DELETE /.netlify/functions/criteria/:id`  
Deletes a criterion.

**Response (200)**:
```json
{
  "message": "Criterion deleted successfully"
}
```

## Choices

### List Choices
**Endpoint**: `GET /.netlify/functions/choices`  
Retrieves choices for a specific project.

**Query Parameters**:
- `projectId`: ID of the project

**Response (200)**:
```json
[
  {
    "id": "choice-uuid",
    "project_id": "project-uuid",
    "description": "Choice Description",
    "disqualified": false,
    "created_by": "user-uuid"
  }
]
```
**Notes**:
- The server automatically extracts the `userId` from the session token in the `sb-auth-token` cookie.

### Create Choices
**Endpoint**: `POST /.netlify/functions/choices`  
Creates new choices for a project.

**Request Body**:
```json
{
  "project_id": "project-uuid",
  "choices": [
    {
      "description": "Choice Description"
    }
  ]
}
```

**Response (201)**:
```json
[
  {
    "id": "choice-uuid",
    "project_id": "project-uuid",
    "description": "Choice Description",
    "disqualified": false,
    "created_by": "user-uuid"
  }
]
```
**Notes**:
- The server automatically extracts the `userId` from the session token in the `sb-auth-token` cookie.

### Update Choice
**Endpoint**: `PUT /.netlify/functions/choices/:id`  
Updates an existing choice.

**Request Body**:
```json
{
  "description": "Updated Description",
  "disqualified": true
}
```

**Response (200)**:
```json
{
  "id": "choice-uuid",
  "project_id": "project-uuid",
  "description": "Updated Description",
  "disqualified": true,
  "created_by": "user-uuid"
}
```
**Notes**:
- The server automatically extracts the `userId` from the session token in the `sb-auth-token` cookie.

### Delete Choice
**Endpoint**: `DELETE /.netlify/functions/choices/:id`  
Deletes a choice.

**Response (200)**:
```json
{
  "message": "Choice deleted successfully"
}
```

## Scores

### Update Score
**Endpoint**: `PUT /.netlify/functions/scores`  
Creates or updates a score for a choice-criteria pair.

**Request Body**:
```json
{
  "criteria_id": "criteria-uuid",
  "choice_id": "choice-uuid",
  "score": 4
}
```

**Response (200)**:
```json
{
  "criteria_id": "criteria-uuid",
  "choice_id": "choice-uuid",
  "score": 4,
    "created_by": "user-uuid"
}
```
**Notes**:
- The server automatically extracts the `userId` from the session token in the `sb-auth-token` cookie.

## Error Responses

All endpoints may return the following error responses:

### Authentication Error (401)
```json
{
  "error": "Unauthorized"
}
```

### Validation Error (400)
```json
{
  "error": "Error message describing the validation failure"
}
```

### Not Found Error (404)
```json
{
  "error": "Resource not found"
}
```

### Server Error (500)
```json
{
  "error": "Internal server error message"
}
```

## Client Implementation Notes

1.  Authentication:
    *   Sign in using the `/.netlify/functions/signin` endpoint.
    *   The session token will be returned in an HTTP-only cookie named `sb-auth-token`.
    *   The server automatically validates the session for protected endpoints.
    *   Handle token expiration by redirecting to sign in.

2.  Project Flow:
    *   Create a project first.
    *   Add criteria with weights.
    *   Add choices.
    *   Score each choice against each criterion.
    *   Calculate final scores based on weighted criteria.

3.  Error Handling:
    *   Implement proper error handling for all API responses.
    *   Handle authentication errors (401) by redirecting to sign in.
    *   Display validation errors (400) to users.
    *   Implement retry logic for network errors and server errors (500).

4.  Real-time Updates:
    *   Consider implementing polling or WebSocket connections for real-time updates.
    *   Update local state when changes occur.

5.  Data Validation:
    *   Validate all input before sending to the API.
    *   Ensure score values are between 0 and 5.
    *   Verify required fields are present.
    *   Check for valid UUIDs in IDs.

## Example Client Usage (JavaScript)

```javascript
// Authentication
async function signIn(email, password) {
  const response = await fetch('/.netlify/functions/signin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password }),
    credentials: 'include' // Important: Ensures cookies are sent & received
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to sign in');
  }

  const result = await response.json();
  return result;
}

// Create Project
async function createProject(title, description) {
  const response = await fetch('/.netlify/functions/projects', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ title, description }),
    credentials: 'include' // Send cookies
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create project');
  }

  return response.json();
}

// Add Criteria
async function addCriteria(projectId, criteria) {
  const response = await fetch('/.netlify/functions/criteria', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ project_id: projectId, criteria }),
    credentials: 'include' // Send cookies
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create criteria');
  }

  return response.json();
}

// Add Choices
async function addChoices(projectId, choices) {
  const response = await fetch('/.netlify/functions/choices', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ project_id: projectId, choices }),
    credentials: 'include' // Send cookies
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create choices');
  }

  return response.json();
}

// Update Score
async function updateScore(criteriaId, choiceId, score) {
  const response = await fetch('/.netlify/functions/scores', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      criteria_id: criteriaId,
      choice_id: choiceId,
      score
    }),
    credentials: 'include' // Send cookies
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update score');
  }

  return response.json();
}

```

## Rate Limiting

The API implements rate limiting to prevent abuse. Clients should handle 429 Too Many Requests responses by implementing exponential backoff.

## Security Considerations

1.  All endpoints require authentication except:
    *   /.netlify/functions/signin
    *   /.netlify/functions/signup
    *   /.netlify/functions/signout

2.  Session tokens are:
    *   HTTP-only cookies
    *   Secure in production
    *   SameSite=None for cross-origin support

3.  Input validation is performed on:
    *   All request parameters
    *   Request body content
    *   URL parameters

4.  CORS headers are configured for:
    *   Allowed origins
    *   Allowed methods
    *   Allowed headers (including `userId`)

## Data Model

### Project

```typescript
interface Project {
  id: string;
  title: string;
  description: string;
  created_by: string;
  created_at: string;
  updated_at?: string; // Optional, as it's only present after updates
}
```

### Criterion

```typescript
interface Criterion {
  id: string;
  project_id: string;
  definition: string;
  weight: number;
  user_id: string;
}
```

### Choice

```typescript
interface Choice {
  id: string;
  project_id: string;
  description: string;
  disqualified: boolean;
  user_id: string;
}
```

### Criterion

```typescript
interface Criterion {
  id: string;
  project_id: string;
  definition: string;
  weight: number;
  created_by: string; // Use created_by instead of user_id
}
```

### Choice

```typescript
interface Choice {
  id: string;
  project_id: string;
  description: string;
  disqualified: boolean;
  created_by: string; // Use created_by instead of user_id
}
```
### Score

```typescript
interface Score {
  criteria_id: string;
  choice_id: string;
  score: number;
  created_by: string; // Use created_by instead of user_id
}
```

## Base URL

The API is hosted on Netlify, and all endpoints are prefixed with `/.netlify/functions/`. For example:

*   Sign in: `POST /.netlify/functions/signin`
*   List projects: `GET /.netlify/functions/projects`

For local development, the base URL will be `http://localhost:8888/.netlify/functions/`.
