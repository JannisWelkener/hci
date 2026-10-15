# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-10-07-project-creation-management/spec.md

## Overview

This API provides RESTful endpoints for managing HCI projects, including CRUD operations, team collaboration features, and ISO 9241-210 phase tracking. All endpoints follow Next.js App Router conventions and are implemented as route handlers in the `app/api` directory.

**Architecture:**
- Backend: Next.js 15.5.4 API Routes (App Router)
- Database: Supabase PostgreSQL with Row Level Security (RLS)
- Authentication: Supabase Auth (JWT-based)
- Validation: Zod schemas
- Response Format: Consistent `ApiResponse<T>` wrapper

**Base URL:** `/api`

## Authentication

All endpoints require authentication via Supabase Auth. The authentication is handled automatically by the Supabase client using HTTP-only cookies.

**Authentication Flow:**
1. User authenticates via Supabase Auth (handled by auth system)
2. Session cookie is automatically included in requests
3. API routes call `supabase.auth.getUser()` to verify authentication
4. User ID (`auth.uid()`) is used for RLS policies and ownership validation

**Error Response for Unauthenticated Requests:**
```typescript
{
  data: null,
  error: {
    message: "Unauthorized"
  }
}
// HTTP Status: 401
```

## Endpoints

### GET /api/projects

**Purpose:** Retrieve all projects accessible to the authenticated user (owned or member of)

**Authentication:** Required

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | 1 | Page number for pagination |
| `limit` | number | No | 10 | Number of projects per page (max: 100) |
| `sort` | string | No | `created_at` | Sort field: `created_at`, `updated_at`, `start_date`, `name` |
| `order` | string | No | `desc` | Sort order: `asc` or `desc` |
| `phase` | string | No | - | Filter by current_phase: `understand_context`, `specify_requirements`, `produce_design_solutions`, `evaluate_against_requirements` |
| `search` | string | No | - | Search in project name and description (case-insensitive) |

**Request Example:**
```typescript
GET /api/projects?page=1&limit=10&sort=created_at&order=desc&phase=understand_context
```

**Response (Success):**
```typescript
{
  data: {
    projects: [
      {
        id: "123e4567-e89b-12d3-a456-426614174000",
        user_id: "user-uuid",
        name: "Mobile Banking App Redesign",
        description: "HCI project to redesign mobile banking experience",
        current_phase: "understand_context",
        start_date: "2025-10-01",
        phase_status: {
          understand_context: "in_progress",
          specify_requirements: "not_started",
          produce_design_solutions: "not_started",
          evaluate_against_requirements: "not_started"
        },
        created_at: "2025-10-07T10:30:00Z",
        updated_at: "2025-10-07T10:30:00Z"
      }
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 25,
      totalPages: 3,
      hasMore: true
    }
  },
  error: null
}
// HTTP Status: 200
```

**TypeScript Types:**
```typescript
type GetProjectsResponse = ApiResponse<{
  projects: Project[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}>

type Project = {
  id: string
  user_id: string
  name: string
  description: string | null
  current_phase: IsoPhase
  start_date: string // ISO date format
  phase_status: PhaseStatus
  created_at: string // ISO timestamp
  updated_at: string // ISO timestamp
}

type IsoPhase =
  | 'understand_context'
  | 'specify_requirements'
  | 'produce_design_solutions'
  | 'evaluate_against_requirements'

type PhaseStatus = {
  understand_context: PhaseStatusValue
  specify_requirements: PhaseStatusValue
  produce_design_solutions: PhaseStatusValue
  evaluate_against_requirements: PhaseStatusValue
}

type PhaseStatusValue = 'not_started' | 'in_progress' | 'completed'
```

**Errors:**
| Status | Error Message | Description |
|--------|--------------|-------------|
| 401 | Unauthorized | User not authenticated |
| 400 | Invalid query parameters | Invalid pagination, sort, or filter parameters |
| 500 | Internal server error | Database or server error |

---

### GET /api/projects/[id]

**Purpose:** Retrieve a specific project by ID with full details including team members

**Authentication:** Required

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (UUID) | Yes | Project ID |

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `include` | string | No | - | Comma-separated relations to include: `members`, `personas`, `user_stories` |

**Request Example:**
```typescript
GET /api/projects/123e4567-e89b-12d3-a456-426614174000?include=members
```

**Response (Success):**
```typescript
{
  data: {
    id: "123e4567-e89b-12d3-a456-426614174000",
    user_id: "user-uuid",
    name: "Mobile Banking App Redesign",
    description: "HCI project to redesign mobile banking experience",
    current_phase: "understand_context",
    start_date: "2025-10-01",
    phase_status: {
      understand_context: "in_progress",
      specify_requirements: "not_started",
      produce_design_solutions: "not_started",
      evaluate_against_requirements: "not_started"
    },
    created_at: "2025-10-07T10:30:00Z",
    updated_at: "2025-10-07T10:30:00Z",
    members: [
      {
        id: "member-uuid-1",
        project_id: "123e4567-e89b-12d3-a456-426614174000",
        user_id: "user-uuid-1",
        role: "owner",
        joined_at: "2025-10-07T10:30:00Z",
        profile: {
          full_name: "John Doe",
          email: "john@example.com",
          display_name: "John",
          avatar_url: "https://example.com/avatar.jpg"
        }
      }
    ]
  },
  error: null
}
// HTTP Status: 200
```

**TypeScript Types:**
```typescript
type GetProjectResponse = ApiResponse<ProjectWithMembers>

type ProjectWithMembers = Project & {
  members?: ProjectMember[]
}

type ProjectMember = {
  id: string
  project_id: string
  user_id: string
  role: 'owner' | 'editor' | 'viewer' | 'member'
  joined_at: string
  profile: {
    full_name: string
    email: string
    display_name: string | null
    avatar_url: string | null
  }
}
```

**Errors:**
| Status | Error Message | Description |
|--------|--------------|-------------|
| 401 | Unauthorized | User not authenticated |
| 403 | Forbidden | User does not have access to this project |
| 404 | Project not found | Project does not exist or user lacks access |
| 500 | Internal server error | Database or server error |

---

### POST /api/projects

**Purpose:** Create a new project with initial phase status and optional team members

**Authentication:** Required

**Request Body:**
```typescript
{
  name: string            // Required, 3-100 characters
  description?: string    // Optional, max 2000 characters
  start_date?: string     // Optional, ISO date format, defaults to today
  current_phase?: IsoPhase // Optional, defaults to 'understand_context'
  member_ids?: string[]   // Optional, array of user IDs to add as members
}
```

**Validation Rules:**
- `name`: Required, 3-100 characters, trimmed
- `description`: Optional, max 2000 characters
- `start_date`: Optional, valid ISO date, not before 2000-01-01, not more than 1 year in future
- `current_phase`: Optional, must be valid IsoPhase value
- `member_ids`: Optional, array of valid UUIDs (users must exist in profiles table)

**Request Example:**
```typescript
POST /api/projects
Content-Type: application/json

{
  "name": "Mobile Banking App Redesign",
  "description": "HCI project to redesign mobile banking experience for Gen Z users",
  "start_date": "2025-10-01",
  "current_phase": "understand_context",
  "member_ids": ["user-uuid-1", "user-uuid-2"]
}
```

**Response (Success):**
```typescript
{
  data: {
    id: "123e4567-e89b-12d3-a456-426614174000",
    user_id: "current-user-uuid",
    name: "Mobile Banking App Redesign",
    description: "HCI project to redesign mobile banking experience for Gen Z users",
    current_phase: "understand_context",
    start_date: "2025-10-01",
    phase_status: {
      understand_context: "not_started",
      specify_requirements: "not_started",
      produce_design_solutions: "not_started",
      evaluate_against_requirements: "not_started"
    },
    created_at: "2025-10-07T10:30:00Z",
    updated_at: "2025-10-07T10:30:00Z",
    members: [
      {
        id: "member-uuid-1",
        user_id: "current-user-uuid",
        role: "owner"
      }
    ]
  },
  error: null
}
// HTTP Status: 201
```

**TypeScript Types:**
```typescript
type CreateProjectRequest = {
  name: string
  description?: string
  start_date?: string
  current_phase?: IsoPhase
  member_ids?: string[]
}

type CreateProjectResponse = ApiResponse<ProjectWithMembers>
```

**Errors:**
| Status | Error Message | Description |
|--------|--------------|-------------|
| 400 | Validation failed | Invalid request body, includes field-specific errors |
| 401 | Unauthorized | User not authenticated |
| 404 | One or more users not found | Some member_ids don't exist in profiles |
| 500 | Internal server error | Database or server error |

**Validation Error Example:**
```typescript
{
  data: null,
  error: {
    message: "Validation failed",
    details: {
      name: ["Name must be at least 3 characters"],
      start_date: ["Invalid date format"]
    }
  }
}
// HTTP Status: 400
```

---

### PATCH /api/projects/[id]

**Purpose:** Update project details including name, description, start date, current phase, or phase status

**Authentication:** Required

**Authorization:** User must be project owner OR member with editor/member role

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (UUID) | Yes | Project ID |

**Request Body:** (All fields optional, at least one required)
```typescript
{
  name?: string            // 3-100 characters
  description?: string     // max 2000 characters, null to clear
  start_date?: string      // ISO date format
  current_phase?: IsoPhase // One of the four ISO phases
}
```

**Validation Rules:**
- At least one field must be provided
- `name`: If provided, 3-100 characters, trimmed
- `description`: If provided, max 2000 characters (or null to clear)
- `start_date`: If provided, valid ISO date
- `current_phase`: If provided, must be valid IsoPhase value

**Request Example:**
```typescript
PATCH /api/projects/123e4567-e89b-12d3-a456-426614174000
Content-Type: application/json

{
  "name": "Mobile Banking App - Updated",
  "current_phase": "specify_requirements"
}
```

**Response (Success):**
```typescript
{
  data: {
    id: "123e4567-e89b-12d3-a456-426614174000",
    user_id: "user-uuid",
    name: "Mobile Banking App - Updated",
    description: "HCI project to redesign mobile banking experience",
    current_phase: "specify_requirements",
    start_date: "2025-10-01",
    phase_status: {
      understand_context: "in_progress",
      specify_requirements: "not_started",
      produce_design_solutions: "not_started",
      evaluate_against_requirements: "not_started"
    },
    created_at: "2025-10-07T10:30:00Z",
    updated_at: "2025-10-07T11:45:00Z"
  },
  error: null
}
// HTTP Status: 200
```

**TypeScript Types:**
```typescript
type UpdateProjectRequest = {
  name?: string
  description?: string | null
  start_date?: string
  current_phase?: IsoPhase
}

type UpdateProjectResponse = ApiResponse<Project>
```

**Errors:**
| Status | Error Message | Description |
|--------|--------------|-------------|
| 400 | Validation failed | Invalid request body |
| 400 | At least one field required | Empty request body |
| 401 | Unauthorized | User not authenticated |
| 403 | Forbidden | User does not have edit access |
| 404 | Project not found | Project does not exist or user lacks access |
| 500 | Internal server error | Database or server error |

---

### DELETE /api/projects/[id]

**Purpose:** Delete a project and all related entities (members, personas, user stories via cascade)

**Authentication:** Required

**Authorization:** Only project owner can delete

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (UUID) | Yes | Project ID |

**Request Example:**
```typescript
DELETE /api/projects/123e4567-e89b-12d3-a456-426614174000
```

**Response (Success):**
```typescript
{
  data: {
    success: true
  },
  error: null
}
// HTTP Status: 200
```

**TypeScript Types:**
```typescript
type DeleteProjectResponse = ApiResponse<{ success: true }>
```

**Errors:**
| Status | Error Message | Description |
|--------|--------------|-------------|
| 401 | Unauthorized | User not authenticated |
| 403 | Forbidden | User is not the project owner |
| 404 | Project not found | Project does not exist |
| 500 | Internal server error | Database or server error |

**Business Logic:**
- Only the original project creator (`user_id` on projects table) can delete
- Deletion cascades to:
  - `project_members` (all team members removed)
  - `personas` (all personas deleted)
  - `user_stories` (all user stories deleted)
- Operation is atomic (all or nothing)

---

### GET /api/projects/[id]/members

**Purpose:** Retrieve all team members for a specific project with their profile information

**Authentication:** Required

**Authorization:** User must have access to the project (owner or member)

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (UUID) | Yes | Project ID |

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `role` | string | No | - | Filter by role: `owner`, `editor`, `viewer`, `member` |

**Request Example:**
```typescript
GET /api/projects/123e4567-e89b-12d3-a456-426614174000/members
```

**Response (Success):**
```typescript
{
  data: [
    {
      id: "member-uuid-1",
      project_id: "123e4567-e89b-12d3-a456-426614174000",
      user_id: "user-uuid-1",
      role: "owner",
      joined_at: "2025-10-07T10:30:00Z",
      created_at: "2025-10-07T10:30:00Z",
      updated_at: "2025-10-07T10:30:00Z",
      profile: {
        id: "user-uuid-1",
        full_name: "John Doe",
        email: "john@example.com",
        display_name: "John",
        avatar_url: "https://example.com/avatar.jpg"
      }
    },
    {
      id: "member-uuid-2",
      project_id: "123e4567-e89b-12d3-a456-426614174000",
      user_id: "user-uuid-2",
      role: "member",
      joined_at: "2025-10-07T11:00:00Z",
      created_at: "2025-10-07T11:00:00Z",
      updated_at: "2025-10-07T11:00:00Z",
      profile: {
        id: "user-uuid-2",
        full_name: "Jane Smith",
        email: "jane@example.com",
        display_name: "Jane",
        avatar_url: null
      }
    }
  ],
  error: null
}
// HTTP Status: 200
```

**TypeScript Types:**
```typescript
type GetProjectMembersResponse = ApiResponse<ProjectMemberWithProfile[]>

type ProjectMemberWithProfile = {
  id: string
  project_id: string
  user_id: string
  role: 'owner' | 'editor' | 'viewer' | 'member'
  joined_at: string
  created_at: string
  updated_at: string
  profile: {
    id: string
    full_name: string
    email: string
    display_name: string | null
    avatar_url: string | null
  }
}
```

**Errors:**
| Status | Error Message | Description |
|--------|--------------|-------------|
| 401 | Unauthorized | User not authenticated |
| 403 | Forbidden | User does not have access to this project |
| 404 | Project not found | Project does not exist |
| 500 | Internal server error | Database or server error |

---

### POST /api/projects/[id]/members

**Purpose:** Add one or more team members to a project

**Authentication:** Required

**Authorization:** Only project owner can add members

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (UUID) | Yes | Project ID |

**Request Body:**
```typescript
{
  user_ids: string[]      // Required, array of user IDs to add (1-20 users)
  role?: 'editor' | 'viewer' | 'member' // Optional, defaults to 'member'
}
```

**Validation Rules:**
- `user_ids`: Required, non-empty array, 1-20 valid UUIDs
- `role`: Optional, must be 'editor', 'viewer', or 'member' (cannot add 'owner')
- Users must exist in profiles table
- Users cannot already be members of the project
- User cannot add themselves (already owner)

**Request Example:**
```typescript
POST /api/projects/123e4567-e89b-12d3-a456-426614174000/members
Content-Type: application/json

{
  "user_ids": ["user-uuid-2", "user-uuid-3"],
  "role": "member"
}
```

**Response (Success):**
```typescript
{
  data: {
    added: [
      {
        id: "member-uuid-2",
        project_id: "123e4567-e89b-12d3-a456-426614174000",
        user_id: "user-uuid-2",
        role: "member",
        joined_at: "2025-10-07T11:00:00Z",
        profile: {
          full_name: "Jane Smith",
          email: "jane@example.com",
          display_name: "Jane",
          avatar_url: null
        }
      }
    ],
    skipped: [
      {
        user_id: "user-uuid-3",
        reason: "User is already a member"
      }
    ]
  },
  error: null
}
// HTTP Status: 201
```

**TypeScript Types:**
```typescript
type AddProjectMembersRequest = {
  user_ids: string[]
  role?: 'editor' | 'viewer' | 'member'
}

type AddProjectMembersResponse = ApiResponse<{
  added: ProjectMemberWithProfile[]
  skipped: Array<{
    user_id: string
    reason: string
  }>
}>
```

**Errors:**
| Status | Error Message | Description |
|--------|--------------|-------------|
| 400 | Validation failed | Invalid request body |
| 400 | Too many users | More than 20 users in single request |
| 401 | Unauthorized | User not authenticated |
| 403 | Forbidden | User is not the project owner |
| 404 | Project not found | Project does not exist |
| 404 | One or more users not found | Some user_ids don't exist |
| 500 | Internal server error | Database or server error |

---

### PATCH /api/projects/[id]/members/[userId]

**Purpose:** Update a team member's role

**Authentication:** Required

**Authorization:** Only project owner can update member roles

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (UUID) | Yes | Project ID |
| `userId` | string (UUID) | Yes | User ID of the member to update |

**Request Body:**
```typescript
{
  role: 'editor' | 'viewer' | 'member' // Required, new role
}
```

**Validation Rules:**
- `role`: Required, must be 'editor', 'viewer', or 'member'
- Cannot change owner role
- Cannot change own role if you're the owner

**Request Example:**
```typescript
PATCH /api/projects/123e4567-e89b-12d3-a456-426614174000/members/user-uuid-2
Content-Type: application/json

{
  "role": "editor"
}
```

**Response (Success):**
```typescript
{
  data: {
    id: "member-uuid-2",
    project_id: "123e4567-e89b-12d3-a456-426614174000",
    user_id: "user-uuid-2",
    role: "editor",
    joined_at: "2025-10-07T11:00:00Z",
    updated_at: "2025-10-07T12:00:00Z"
  },
  error: null
}
// HTTP Status: 200
```

**TypeScript Types:**
```typescript
type UpdateProjectMemberRequest = {
  role: 'editor' | 'viewer' | 'member'
}

type UpdateProjectMemberResponse = ApiResponse<ProjectMember>
```

**Errors:**
| Status | Error Message | Description |
|--------|--------------|-------------|
| 400 | Validation failed | Invalid role value |
| 400 | Cannot modify owner role | Attempting to change owner's role |
| 401 | Unauthorized | User not authenticated |
| 403 | Forbidden | User is not the project owner |
| 404 | Member not found | Member does not exist in this project |
| 500 | Internal server error | Database or server error |

---

### DELETE /api/projects/[id]/members/[userId]

**Purpose:** Remove a team member from a project

**Authentication:** Required

**Authorization:** Only project owner can remove members

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (UUID) | Yes | Project ID |
| `userId` | string (UUID) | Yes | User ID of the member to remove |

**Business Logic:**
- Cannot remove the project owner (user_id from projects table)
- Member's access is immediately revoked
- Member can no longer view or edit the project

**Request Example:**
```typescript
DELETE /api/projects/123e4567-e89b-12d3-a456-426614174000/members/user-uuid-2
```

**Response (Success):**
```typescript
{
  data: {
    success: true,
    removed_user_id: "user-uuid-2"
  },
  error: null
}
// HTTP Status: 200
```

**TypeScript Types:**
```typescript
type RemoveProjectMemberResponse = ApiResponse<{
  success: true
  removed_user_id: string
}>
```

**Errors:**
| Status | Error Message | Description |
|--------|--------------|-------------|
| 400 | Cannot remove project owner | Attempting to remove the owner |
| 401 | Unauthorized | User not authenticated |
| 403 | Forbidden | User is not the project owner |
| 404 | Member not found | Member does not exist in this project |
| 500 | Internal server error | Database or server error |

---

### PATCH /api/projects/[id]/phases

**Purpose:** Update the status of one or more ISO 9241-210 phases

**Authentication:** Required

**Authorization:** User must be project owner OR member with editor/member role

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (UUID) | Yes | Project ID |

**Request Body:**
```typescript
{
  phase_status: {
    understand_context?: 'not_started' | 'in_progress' | 'completed'
    specify_requirements?: 'not_started' | 'in_progress' | 'completed'
    produce_design_solutions?: 'not_started' | 'in_progress' | 'completed'
    evaluate_against_requirements?: 'not_started' | 'in_progress' | 'completed'
  }
  // Optional: also update current_phase to reflect the new focus
  current_phase?: IsoPhase
}
```

**Validation Rules:**
- At least one phase must be provided in `phase_status`
- Each phase value must be one of: 'not_started', 'in_progress', 'completed'
- Updates are partial (only specified phases are changed)
- If `current_phase` is provided, it must be a valid IsoPhase value

**Request Example:**
```typescript
PATCH /api/projects/123e4567-e89b-12d3-a456-426614174000/phases
Content-Type: application/json

{
  "phase_status": {
    "understand_context": "completed",
    "specify_requirements": "in_progress"
  },
  "current_phase": "specify_requirements"
}
```

**Response (Success):**
```typescript
{
  data: {
    id: "123e4567-e89b-12d3-a456-426614174000",
    user_id: "user-uuid",
    name: "Mobile Banking App Redesign",
    description: "HCI project to redesign mobile banking experience",
    current_phase: "specify_requirements",
    start_date: "2025-10-01",
    phase_status: {
      understand_context: "completed",
      specify_requirements: "in_progress",
      produce_design_solutions: "not_started",
      evaluate_against_requirements: "not_started"
    },
    created_at: "2025-10-07T10:30:00Z",
    updated_at: "2025-10-07T14:20:00Z"
  },
  error: null
}
// HTTP Status: 200
```

**TypeScript Types:**
```typescript
type UpdatePhaseStatusRequest = {
  phase_status: Partial<PhaseStatus>
  current_phase?: IsoPhase
}

type UpdatePhaseStatusResponse = ApiResponse<Project>
```

**Errors:**
| Status | Error Message | Description |
|--------|--------------|-------------|
| 400 | Validation failed | Invalid phase status values |
| 400 | At least one phase required | Empty phase_status object |
| 401 | Unauthorized | User not authenticated |
| 403 | Forbidden | User does not have edit access |
| 404 | Project not found | Project does not exist or user lacks access |
| 500 | Internal server error | Database or server error |

**Business Logic:**
- Phase updates are tracked in the `phase_status` JSONB column
- The `current_phase` field indicates which phase the team is actively working on
- Multiple phases can be in progress simultaneously
- Phase status history is not tracked (consider adding activity log in future)

---

## Response Formats

### Success Response

All successful responses follow this structure:

```typescript
{
  data: T | T[] | PaginatedData<T>,
  error: null
}
```

**Single Resource:**
```typescript
{
  data: {
    id: "...",
    // ... resource fields
  },
  error: null
}
```

**Multiple Resources:**
```typescript
{
  data: [
    { id: "1", ... },
    { id: "2", ... }
  ],
  error: null
}
```

**Paginated Resources:**
```typescript
{
  data: {
    projects: [...],
    pagination: {
      page: 1,
      limit: 10,
      total: 25,
      totalPages: 3,
      hasMore: true
    }
  },
  error: null
}
```

### Error Response

All error responses follow this structure:

```typescript
{
  data: null,
  error: {
    message: string,      // Human-readable error message
    code?: string,        // Optional error code (e.g., Supabase error codes)
    details?: unknown     // Optional additional details (e.g., validation errors)
  }
}
```

**Common Error Formats:**

**400 Validation Error:**
```typescript
{
  data: null,
  error: {
    message: "Validation failed",
    details: {
      name: ["Name must be at least 3 characters"],
      start_date: ["Invalid date format"]
    }
  }
}
```

**401 Unauthorized:**
```typescript
{
  data: null,
  error: {
    message: "Unauthorized"
  }
}
```

**403 Forbidden:**
```typescript
{
  data: null,
  error: {
    message: "You do not have permission to perform this action"
  }
}
```

**404 Not Found:**
```typescript
{
  data: null,
  error: {
    message: "Project not found"
  }
}
```

**500 Internal Server Error:**
```typescript
{
  data: null,
  error: {
    message: "Internal server error",
    code: "PGRST301" // Example Supabase error code
  }
}
```

## Business Logic

### Authentication & Authorization

**Authentication:**
- All endpoints require a valid Supabase Auth session
- Session is validated using `supabase.auth.getUser()`
- Unauthenticated requests return 401

**Authorization Rules:**

1. **Project Access (View):**
   - Project owner (user_id matches)
   - OR Project member (exists in project_members table)

2. **Project Modification (Edit/Update):**
   - Project owner
   - OR Project member with role: 'owner', 'editor', or 'member'
   - Viewers cannot edit

3. **Project Deletion:**
   - ONLY project owner (user_id from projects table)
   - Members cannot delete, even with 'owner' role in project_members

4. **Team Management (Add/Remove/Update Members):**
   - ONLY project owner
   - Members cannot manage team, even with 'owner' role

### Validation Rules

**Project Name:**
- Required on creation
- 3-100 characters
- Trimmed of whitespace
- No special validation (allows any characters)

**Project Description:**
- Optional
- Max 2000 characters
- Can be null
- Trimmed of whitespace

**Start Date:**
- Optional, defaults to current date
- Must be valid ISO date format (YYYY-MM-DD)
- Cannot be before 2000-01-01
- Cannot be more than 1 year in the future
- Date-only (no time component)

**Current Phase:**
- Must be one of the four IsoPhase values
- Defaults to 'understand_context' on creation
- Can be changed at any time

**Phase Status:**
- All four phases must always be present
- Each phase value must be: 'not_started', 'in_progress', or 'completed'
- Enforced by database constraint
- Initialized to all 'not_started' on project creation

**Member Management:**
- User IDs must exist in profiles table
- Cannot add same user twice to a project
- Max 20 users per single add request
- Role must be: 'owner', 'editor', 'viewer', or 'member'
- Cannot set role to 'owner' via API (only via user_id in projects)

### Error Handling Strategy

1. **Input Validation:**
   - Use Zod schemas for request validation
   - Return 400 with field-specific errors
   - Validate before database operations

2. **Authentication Errors:**
   - Check auth first in all endpoints
   - Return 401 if not authenticated
   - Clear, consistent error messages

3. **Authorization Errors:**
   - Check permissions after auth
   - Return 403 if action not allowed
   - Distinguish from 404 (don't reveal existence)

4. **Not Found Errors:**
   - Return 404 for non-existent resources
   - Also return 404 for unauthorized access (security)
   - Use Supabase error code PGRST116 to detect

5. **Database Errors:**
   - Catch all database exceptions
   - Return 500 for unexpected errors
   - Log errors server-side (future: error monitoring)
   - Don't expose internal details to client

6. **Transaction Safety:**
   - Use Supabase transactions for multi-step operations
   - Rollback on any error
   - Maintain data consistency

### Pagination

**Default Values:**
- Default page: 1
- Default limit: 10
- Maximum limit: 100
- Minimum limit: 1

**Query Parameters:**
- `page`: 1-indexed page number
- `limit`: Number of items per page

**Response Includes:**
- `page`: Current page number
- `limit`: Items per page
- `total`: Total number of items
- `totalPages`: Total number of pages
- `hasMore`: Boolean indicating more pages exist

**Implementation:**
- Use SQL `OFFSET` and `LIMIT`
- Count total separately for performance
- Return empty array if page exceeds total

### Sorting & Filtering

**Sorting:**
- Default: `created_at DESC` (newest first)
- Supported fields: `created_at`, `updated_at`, `start_date`, `name`
- Supported orders: `asc`, `desc`
- Invalid sort fields fallback to default

**Filtering:**
- `phase`: Filter by current_phase
- `search`: Case-insensitive search in name and description
- Filters are AND-ed together
- Empty filters return all accessible projects

### Performance Considerations

1. **Indexes:**
   - All foreign keys have indexes
   - Commonly queried fields indexed (phase_status, start_date)
   - GIN index on JSONB columns for efficient queries

2. **Query Optimization:**
   - Use `.select()` to fetch only needed columns
   - Use `.single()` for single-row queries
   - Minimize joins where possible

3. **N+1 Prevention:**
   - Use Supabase nested selects
   - Fetch related data in single query when possible
   - Example: `select('*, project_members(*, profiles(*))')`

4. **Caching:**
   - Consider implementing HTTP caching headers (future)
   - Use SWR/React Query on frontend for client-side cache
   - Leverage Supabase Realtime for live updates (future)

### Security Considerations

1. **Row Level Security:**
   - All tables have RLS enabled
   - Policies enforce authorization at database level
   - Cannot be bypassed by application bugs

2. **Input Sanitization:**
   - Zod validation prevents injection attacks
   - Supabase client uses parameterized queries
   - No raw SQL from user input

3. **Rate Limiting:**
   - Consider implementing in future (not in scope)
   - Use Vercel/Next.js built-in protections

4. **Data Privacy:**
   - Only expose necessary user data in responses
   - Filter sensitive profile fields
   - Don't return email addresses to non-members

5. **CORS:**
   - Next.js API routes same-origin by default
   - Configure CORS if needed for external clients

### Future Enhancements

1. **Real-time Updates:**
   - Supabase Realtime for live collaboration
   - WebSocket connections for instant updates

2. **Activity Log:**
   - Track all project changes
   - Audit trail for compliance
   - History timeline for users

3. **File Uploads:**
   - Supabase Storage integration
   - Project attachments and assets

4. **Notifications:**
   - Email notifications for member additions
   - In-app notifications for project updates

5. **Advanced Permissions:**
   - Granular role permissions
   - Custom roles per project

6. **Webhooks:**
   - External integrations
   - Event-driven architecture

7. **Analytics:**
   - Project progress metrics
   - Team activity statistics
   - Phase completion insights
