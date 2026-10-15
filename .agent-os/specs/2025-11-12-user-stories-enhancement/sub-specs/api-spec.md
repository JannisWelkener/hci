# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-11-12-user-stories-enhancement/spec.md

## Overview

This document specifies the API changes required to support user stories enhancements including description field, drag-and-drop priority ordering, dependency tracking, and AI-assisted generation. Most endpoints require updates to handle new fields, and two new endpoints are added for AI generation and bulk reordering.

## Modified Endpoints

### GET /api/projects/[id]/user-stories

Fetch paginated list of user stories for a project.

**Changes**: Response now includes new fields (description, priority_order, generation_method, dependencies)

**Request**:
```
GET /api/projects/[projectId]/user-stories?page=1&limit=50&sort=priority_order&order=asc
```

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number (1-indexed) |
| limit | number | 50 | Items per page (max 100) |
| sort | enum | 'created_at' | Sort field: 'priority', 'status', 'created_at', 'updated_at', 'title', **'priority_order'** (new) |
| order | enum | 'desc' | Sort order: 'asc' or 'desc' |
| status | enum | - | Filter by status (optional) |
| priority | enum | - | Filter by priority level (optional) |

**Response** (200 OK):
```typescript
{
  "data": {
    "items": [
      {
        "id": "uuid",
        "project_id": "uuid",
        "title": "User login functionality",
        "user_role": "registered user",
        "action": "log in with email and password",
        "benefit": "I can access my personalized dashboard",
        "description": "Users need secure authentication...",  // NEW
        "acceptance_criteria": ["Password min 8 chars", "Email validation"],
        "priority": "high",
        "priority_order": 2000,  // NEW
        "status": "backlog",
        "story_points": 5,
        "generation_method": "manual",  // NEW
        "dependencies": [  // NEW
          {
            "story_id": "uuid-123",
            "type": "requires"
          }
        ],
        "created_at": "2025-11-12T10:00:00Z",
        "updated_at": "2025-11-12T10:00:00Z",
        "created_by": "uuid"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 150,
      "totalPages": 3
    }
  },
  "error": null
}
```

**Error Responses**:
- 401 Unauthorized: User not authenticated
- 403 Forbidden: User not a member of the project
- 404 Not Found: Project does not exist

---

### POST /api/projects/[id]/user-stories

Create a new user story.

**Changes**: Accept new fields (description, priority_order, generation_method, dependencies)

**Request**:
```
POST /api/projects/[projectId]/user-stories
Content-Type: application/json
```

**Request Body**:
```typescript
{
  "title": "User login functionality",
  "user_role": "registered user",
  "action": "log in with email and password",
  "benefit": "I can access my personalized dashboard",
  "description": "Users need secure authentication to protect their data",  // NEW (optional)
  "acceptance_criteria": ["Password min 8 chars", "Email validation"],
  "priority": "high",
  "priority_order": 2000,  // NEW (optional, auto-calculated if not provided)
  "status": "backlog",
  "story_points": 5,
  "generation_method": "manual",  // NEW (required, default: "manual")
  "dependencies": [  // NEW (optional, default: [])
    {
      "story_id": "uuid-123",
      "type": "requires"
    }
  ]
}
```

**Validation Rules**:
- title: required, 1-200 chars
- user_role: required, 1-100 chars
- action: required, 1-500 chars
- benefit: required, 1-500 chars
- **description**: optional, max 2000 chars (NEW)
- acceptance_criteria: optional array, each item max 500 chars
- priority: enum ['low', 'medium', 'high', 'critical'], default 'medium'
- **priority_order**: optional integer, auto-calculated as `MAX(priority_order) + 1000` if not provided (NEW)
- status: enum ['backlog', 'in_progress', 'done'], default 'backlog'
- story_points: optional integer, 1-100
- **generation_method**: required enum ['manual', 'ai_generated'], default 'manual' (NEW)
- **dependencies**: optional array of {story_id: UUID, type: enum}, default [] (NEW)

**Additional Validation**:
- Dependencies: Validate that all story_id values exist in the same project
- Dependencies: Prevent self-references (story_id !== current story id)
- Dependencies: Validate type is one of ['blocks', 'requires', 'relates_to']

**Response** (201 Created):
```typescript
{
  "data": {
    "id": "uuid",
    "project_id": "uuid",
    // ... all fields including new ones
  },
  "error": null
}
```

**Error Responses**:
- 400 Bad Request: Validation errors
- 401 Unauthorized: User not authenticated
- 403 Forbidden: User not a member of the project
- 404 Not Found: Project or dependency story not found

---

### PATCH /api/projects/[id]/user-stories/[storyId]

Update an existing user story.

**Changes**: Accept new fields for update

**Request**:
```
PATCH /api/projects/[projectId]/user-stories/[storyId]
Content-Type: application/json
```

**Request Body** (all fields optional):
```typescript
{
  "title": "Updated title",
  "user_role": "updated role",
  "action": "updated action",
  "benefit": "updated benefit",
  "description": "Updated description text",  // NEW
  "acceptance_criteria": ["Updated criterion"],
  "priority": "critical",
  "priority_order": 1500,  // NEW
  "status": "in_progress",
  "story_points": 8,
  "generation_method": "ai_generated",  // NEW (typically not changed after creation)
  "dependencies": [  // NEW
    {
      "story_id": "uuid-456",
      "type": "blocks"
    }
  ]
}
```

**Validation Rules**: Same as POST, but all fields optional

**Response** (200 OK):
```typescript
{
  "data": {
    "id": "uuid",
    // ... updated story with all fields
  },
  "error": null
}
```

**Error Responses**:
- 400 Bad Request: Validation errors
- 401 Unauthorized: User not authenticated
- 403 Forbidden: User not a member of the project
- 404 Not Found: Project or story not found

---

### DELETE /api/projects/[id]/user-stories/[storyId]

Delete a user story.

**Changes**: None (endpoint unchanged, works with new fields automatically)

**Request**:
```
DELETE /api/projects/[projectId]/user-stories/[storyId]
```

**Response** (200 OK):
```typescript
{
  "data": {
    "message": "User story deleted successfully"
  },
  "error": null
}
```

**Error Responses**:
- 401 Unauthorized: User not authenticated
- 403 Forbidden: User not a member of the project
- 404 Not Found: Story not found

---

### GET /api/projects/[id]/user-stories/[storyId]

Fetch a single user story by ID.

**Changes**: Response now includes new fields

**Request**:
```
GET /api/projects/[projectId]/user-stories/[storyId]
```

**Response** (200 OK):
```typescript
{
  "data": {
    "id": "uuid",
    "project_id": "uuid",
    // ... all fields including new ones (description, priority_order, generation_method, dependencies)
  },
  "error": null
}
```

**Error Responses**:
- 401 Unauthorized: User not authenticated
- 403 Forbidden: User not a member of the project
- 404 Not Found: Story not found

---

## New Endpoints

### POST /api/projects/[id]/user-stories/generate

Generate a user story from natural language description using AI (mocked).

**Purpose**: Convert free-form description into structured user story format (role, action, benefit)

**Request**:
```
POST /api/projects/[projectId]/user-stories/generate
Content-Type: application/json
```

**Request Body**:
```typescript
{
  "description": "Users need to be able to save their work in progress so they don't lose data if they accidentally close the browser"
}
```

**Validation Rules**:
- description: required, min 10 chars, max 2000 chars

**Response** (200 OK):
```typescript
{
  "data": {
    "title": "Autosave functionality for work in progress",
    "user_role": "application user",
    "action": "have my work automatically saved as I type",
    "benefit": "I don't lose data if I accidentally close the browser",
    "description": "Users need to be able to save their work in progress so they don't lose data if they accidentally close the browser",
    "suggested_acceptance_criteria": [
      "Work is saved every 30 seconds automatically",
      "Visual indicator shows when content is being saved",
      "Saved drafts persist across browser sessions"
    ]
  },
  "error": null
}
```

**Implementation Notes**:
- **Phase 1 (MVP)**: Mock AI service with pattern-based generation
  - Extract keywords from description
  - Generate plausible story using templates
  - Return after 500ms delay to simulate API call
- **Phase 2**: Replace with real OpenAI API integration
  - Use GPT-4 with structured output
  - Prompt engineering for quality user stories
  - Error handling for API failures

**Mock Implementation Example**:
```typescript
// lib/services/ai-story-generator.ts
export async function generateUserStory(description: string) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Simple pattern matching for demo
  const title = extractTitle(description);
  const action = extractAction(description);

  return {
    title,
    user_role: "user",
    action,
    benefit: "achieve my goal efficiently",
    description,
    suggested_acceptance_criteria: generateCriteria(description)
  };
}
```

**Error Responses**:
- 400 Bad Request: Invalid description (too short, too long)
- 401 Unauthorized: User not authenticated
- 403 Forbidden: User not a member of the project
- 500 Internal Server Error: AI generation failed
- 503 Service Unavailable: AI service timeout

---

### PATCH /api/projects/[id]/user-stories/reorder

Bulk update priority_order for multiple user stories (used after drag-and-drop).

**Purpose**: Efficiently update the priority_order field for multiple stories in a single transaction

**Request**:
```
PATCH /api/projects/[projectId]/user-stories/reorder
Content-Type: application/json
```

**Request Body**:
```typescript
{
  "stories": [
    {
      "id": "uuid-1",
      "priority_order": 1000
    },
    {
      "id": "uuid-2",
      "priority_order": 2000
    },
    {
      "id": "uuid-3",
      "priority_order": 3000
    }
  ]
}
```

**Validation Rules**:
- stories: required array, min 1 item, max 100 items
- Each item: { id: UUID, priority_order: integer }
- All story IDs must belong to the specified project

**Response** (200 OK):
```typescript
{
  "data": {
    "message": "Priority order updated for 3 stories",
    "updated_count": 3
  },
  "error": null
}
```

**Implementation Notes**:
- Use database transaction for atomicity
- Only update priority_order and updated_at fields
- Validate all story IDs exist and belong to project before updating
- Optimistic locking: Check updated_at to detect concurrent modifications

**Error Responses**:
- 400 Bad Request: Validation errors (invalid IDs, missing fields)
- 401 Unauthorized: User not authenticated
- 403 Forbidden: User not a member of the project
- 404 Not Found: One or more story IDs not found
- 409 Conflict: Concurrent modification detected

---

### GET /api/projects/[id]/user-stories/[storyId]/dependencies

Fetch all related stories (dependencies and dependents) for a specific story.

**Purpose**: Get detailed information about all stories this story depends on and all stories that depend on this story

**Request**:
```
GET /api/projects/[projectId]/user-stories/[storyId]/dependencies
```

**Response** (200 OK):
```typescript
{
  "data": {
    "dependencies": [  // Stories this story depends on
      {
        "id": "uuid-123",
        "title": "User authentication",
        "status": "done",
        "priority": "high",
        "dependency_type": "requires"
      }
    ],
    "dependents": [  // Stories that depend on this story
      {
        "id": "uuid-456",
        "title": "Password reset",
        "status": "backlog",
        "priority": "medium",
        "dependency_type": "requires"
      }
    ]
  },
  "error": null
}
```

**Implementation Notes**:
- Query both directions: stories in this story's dependencies array AND stories that have this story in their dependencies array
- Return minimal story info (id, title, status, priority) for performance
- Use GIN index on dependencies JSONB field for efficient lookup

**Error Responses**:
- 401 Unauthorized: User not authenticated
- 403 Forbidden: User not a member of the project
- 404 Not Found: Story not found

---

## Updated Validation Schemas

Update existing Zod schemas in `/lib/validations/user-story.ts`:

```typescript
import { z } from 'zod'

// Dependency type enum
const dependencyTypeSchema = z.enum(['blocks', 'requires', 'relates_to'])

// Single dependency object
const dependencySchema = z.object({
  story_id: z.string().uuid('Invalid story ID format'),
  type: dependencyTypeSchema
})

// Generation method enum
const generationMethodSchema = z.enum(['manual', 'ai_generated'])

// Updated create schema
export const createUserStorySchema = z.object({
  title: z.string().min(1).max(200).trim(),
  user_role: z.string().min(1).max(100).trim(),
  action: z.string().min(1).max(500).trim(),
  benefit: z.string().min(1).max(500).trim(),

  // NEW FIELDS
  description: z.string().max(2000).trim().optional().nullable(),
  priority_order: z.number().int().optional(),
  generation_method: generationMethodSchema.default('manual'),
  dependencies: z.array(dependencySchema).default([]),

  // EXISTING FIELDS
  acceptance_criteria: z.array(z.string().max(500).trim())
    .optional()
    .default([])
    .transform(val => val.filter(item => item.length > 0)),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  status: z.enum(['backlog', 'in_progress', 'done']).default('backlog'),
  story_points: z.number().int().positive().max(100).optional().nullable(),
})

// AI generation request schema
export const generateUserStorySchema = z.object({
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must be 2000 characters or less')
    .trim()
})

// Bulk reorder schema
export const reorderUserStoriesSchema = z.object({
  stories: z.array(
    z.object({
      id: z.string().uuid(),
      priority_order: z.number().int()
    })
  ).min(1).max(100)
})
```

## Error Handling

All endpoints return errors in consistent format:

```typescript
{
  "data": null,
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE",
    "details": {
      // Additional error context (validation errors, etc.)
    }
  }
}
```

**Common Error Codes**:
- `UNAUTHORIZED`: User not authenticated
- `FORBIDDEN`: User lacks permission
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Request validation failed
- `CONFLICT`: Concurrent modification detected
- `INTERNAL_ERROR`: Server error
- `AI_GENERATION_FAILED`: AI service error
- `SERVICE_UNAVAILABLE`: External service timeout

## Rate Limiting

- **AI Generation Endpoint**: 10 requests per minute per user (to prevent abuse and manage costs)
- **Other Endpoints**: 100 requests per minute per user (existing rate limits)

## Backward Compatibility

All new fields are optional or have defaults, ensuring existing clients continue to work:
- Clients not sending new fields will get sensible defaults
- Clients not expecting new fields in responses can safely ignore them
- Existing API contracts are preserved

## Testing Requirements

### Unit Tests
- Zod schema validation for all new fields
- Dependency validation logic (no self-references, valid UUIDs)
- Mock AI generator function

### Integration Tests
- Create story with dependencies
- Generate story from description (mocked)
- Bulk reorder stories
- Fetch dependencies endpoint
- Update story with new fields

### E2E Tests
- Complete user flow: generate story → edit → add dependencies → reorder
- Error handling for invalid dependencies
- Concurrent reorder operations
