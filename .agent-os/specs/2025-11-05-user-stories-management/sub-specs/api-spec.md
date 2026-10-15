# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-11-05-user-stories-management/spec.md

## API Endpoints

### GET /api/projects/[projectId]/user-stories

**Purpose:** Fetch all user stories for a specific project

**Authentication:** Required (checks project membership via RLS)

**Parameters:**
- `projectId` (path parameter, UUID) - The project ID

**Query Parameters:**
- `sort` (optional) - Sort field: `priority`, `status`, `created_at`, `updated_at`
- `order` (optional) - Sort order: `asc` or `desc` (default: `desc`)
- `page` (optional) - Page number for pagination (default: 1)
- `limit` (optional) - Items per page (default: 50, max: 100)

**Response (Success 200):**
```json
{
  "data": {
    "items": [
      {
        "id": "uuid",
        "project_id": "uuid",
        "title": "User registration flow",
        "user_role": "student",
        "action": "create an account with email and password",
        "benefit": "I can access the HCI Hub platform",
        "acceptance_criteria": [
          "Email validation is performed",
          "Password must be at least 8 characters",
          "Confirmation email is sent"
        ],
        "priority": "high",
        "status": "in_progress",
        "story_points": 5,
        "created_at": "2025-11-05T10:00:00Z",
        "updated_at": "2025-11-05T11:00:00Z",
        "created_by": "uuid"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 15,
      "totalPages": 1,
      "hasMore": false
    }
  },
  "error": null
}
```

**Response (Error 403):**
```json
{
  "data": null,
  "error": {
    "message": "Not authorized to access this project",
    "code": "FORBIDDEN"
  }
}
```

**Response (Error 404):**
```json
{
  "data": null,
  "error": {
    "message": "Project not found",
    "code": "NOT_FOUND"
  }
}
```

---

### GET /api/projects/[projectId]/user-stories/[storyId]

**Purpose:** Fetch a single user story by ID

**Authentication:** Required (checks project membership via RLS)

**Parameters:**
- `projectId` (path parameter, UUID) - The project ID
- `storyId` (path parameter, UUID) - The user story ID

**Response (Success 200):**
```json
{
  "data": {
    "id": "uuid",
    "project_id": "uuid",
    "title": "User registration flow",
    "user_role": "student",
    "action": "create an account with email and password",
    "benefit": "I can access the HCI Hub platform",
    "acceptance_criteria": [
      "Email validation is performed",
      "Password must be at least 8 characters",
      "Confirmation email is sent"
    ],
    "priority": "high",
    "status": "in_progress",
    "story_points": 5,
    "created_at": "2025-11-05T10:00:00Z",
    "updated_at": "2025-11-05T11:00:00Z",
    "created_by": "uuid"
  },
  "error": null
}
```

**Response (Error 404):**
```json
{
  "data": null,
  "error": {
    "message": "User story not found",
    "code": "NOT_FOUND"
  }
}
```

---

### POST /api/projects/[projectId]/user-stories

**Purpose:** Create a new user story

**Authentication:** Required (user must be project member)

**Parameters:**
- `projectId` (path parameter, UUID) - The project ID

**Request Body:**
```json
{
  "title": "User registration flow",
  "user_role": "student",
  "action": "create an account with email and password",
  "benefit": "I can access the HCI Hub platform",
  "acceptance_criteria": [
    "Email validation is performed",
    "Password must be at least 8 characters",
    "Confirmation email is sent"
  ],
  "priority": "high",
  "status": "backlog",
  "story_points": 5
}
```

**Validation Rules:**
- `title`: required, string, 1-200 characters
- `user_role`: required, string, 1-100 characters
- `action`: required, string, 1-500 characters
- `benefit`: required, string, 1-500 characters
- `acceptance_criteria`: optional, array of strings (each max 500 chars)
- `priority`: optional, enum ('low', 'medium', 'high', 'critical'), default 'medium'
- `status`: optional, enum ('backlog', 'in_progress', 'done'), default 'backlog'
- `story_points`: optional, integer, 1-100

**Response (Success 201):**
```json
{
  "data": {
    "id": "uuid",
    "project_id": "uuid",
    "title": "User registration flow",
    "user_role": "student",
    "action": "create an account with email and password",
    "benefit": "I can access the HCI Hub platform",
    "acceptance_criteria": [
      "Email validation is performed",
      "Password must be at least 8 characters",
      "Confirmation email is sent"
    ],
    "priority": "high",
    "status": "backlog",
    "story_points": 5,
    "created_at": "2025-11-05T10:00:00Z",
    "updated_at": "2025-11-05T10:00:00Z",
    "created_by": "uuid"
  },
  "error": null
}
```

**Response (Error 400):**
```json
{
  "data": null,
  "error": {
    "message": "Validation failed: title is required",
    "code": "VALIDATION_ERROR"
  }
}
```

---

### PATCH /api/projects/[projectId]/user-stories/[storyId]

**Purpose:** Update an existing user story

**Authentication:** Required (user must be project member)

**Parameters:**
- `projectId` (path parameter, UUID) - The project ID
- `storyId` (path parameter, UUID) - The user story ID

**Request Body (all fields optional):**
```json
{
  "title": "Enhanced user registration flow",
  "user_role": "new student",
  "action": "create an account with email, password, and profile",
  "benefit": "I can access the platform with a complete profile",
  "acceptance_criteria": [
    "Email validation is performed",
    "Password must be at least 8 characters",
    "Confirmation email is sent",
    "Profile information is collected"
  ],
  "priority": "critical",
  "status": "in_progress",
  "story_points": 8
}
```

**Validation Rules:** Same as POST, but all fields are optional

**Response (Success 200):**
```json
{
  "data": {
    "id": "uuid",
    "project_id": "uuid",
    "title": "Enhanced user registration flow",
    "user_role": "new student",
    "action": "create an account with email, password, and profile",
    "benefit": "I can access the platform with a complete profile",
    "acceptance_criteria": [
      "Email validation is performed",
      "Password must be at least 8 characters",
      "Confirmation email is sent",
      "Profile information is collected"
    ],
    "priority": "critical",
    "status": "in_progress",
    "story_points": 8,
    "created_at": "2025-11-05T10:00:00Z",
    "updated_at": "2025-11-05T12:00:00Z",
    "created_by": "uuid"
  },
  "error": null
}
```

**Response (Error 404):**
```json
{
  "data": null,
  "error": {
    "message": "User story not found",
    "code": "NOT_FOUND"
  }
}
```

---

### DELETE /api/projects/[projectId]/user-stories/[storyId]

**Purpose:** Delete a user story

**Authentication:** Required (user must be project member)

**Parameters:**
- `projectId` (path parameter, UUID) - The project ID
- `storyId` (path parameter, UUID) - The user story ID

**Response (Success 200):**
```json
{
  "data": {
    "message": "User story deleted successfully"
  },
  "error": null
}
```

**Response (Error 404):**
```json
{
  "data": null,
  "error": {
    "message": "User story not found",
    "code": "NOT_FOUND"
  }
}
```

---

## Business Logic

### Authorization

All endpoints verify:
1. User is authenticated (via Supabase auth middleware)
2. User is a member of the specified project (via RLS policies on user_stories table)

### Validation

- Zod schemas validate all input data on the server
- Database constraints provide additional validation layer
- Acceptance criteria array is sanitized to remove empty strings

### Error Handling

Standard error codes:
- `400` - Validation error (malformed request)
- `401` - Authentication required (no session)
- `403` - Forbidden (not a project member)
- `404` - Resource not found (project or user story)
- `500` - Server error (database or unexpected errors)

### Data Integrity

- `created_by` is automatically set from authenticated user session
- `project_id` from URL path is validated against existing projects
- `updated_at` timestamp is automatically updated via database trigger
- Cascade deletes ensure orphaned user stories are removed when projects are deleted

## Implementation Pattern

Following the established patterns in `docs/API_PATTERNS.md`:

1. Route structure: `app/api/projects/[projectId]/user-stories/route.ts` and `app/api/projects/[projectId]/user-stories/[storyId]/route.ts`
2. Request validation using Zod schemas
3. Response format using `ApiResponse<T>` type
4. Authentication via `getCurrentUser()` utility
5. Database queries using Supabase client with RLS enforcement
6. Proper HTTP status codes and error messages
