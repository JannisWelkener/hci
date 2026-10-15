# API Specification

This is the API specification for the spec detailed at `.agent-os/specs/2025-10-21-team-development-foundation/spec.md`

## Overview

This spec does NOT require new API endpoints. The purpose is to **document existing API patterns** established in the project creation & management feature for team reference.

The documentation will be created at `docs/API_PATTERNS.md` and will serve as a guide for team members building new features (personas, user stories, methods, etc.).

## Documentation Requirements

### File Location
`docs/API_PATTERNS.md`

### Required Sections

#### 1. Route Structure Convention

**Content:** Document the established pattern for API routes

**Example Content:**
```
## Route Structure

API routes follow RESTful conventions:

- `GET /api/[resource]` - List all resources (with optional query params)
- `GET /api/[resource]/[id]` - Get single resource
- `POST /api/[resource]` - Create new resource
- `PATCH /api/[resource]/[id]` - Update resource
- `DELETE /api/[resource]/[id]` - Delete resource

Nested resources for related entities:
- `POST /api/[resource]/[id]/[subresource]` - Add related entity
- `DELETE /api/[resource]/[id]/[subresource]/[subId]` - Remove related entity
- `PATCH /api/[resource]/[id]/[subresource]` - Update related entity

Examples:
- `/api/projects` - Projects collection
- `/api/projects/[id]` - Single project
- `/api/projects/[id]/members` - Add member to project
- `/api/projects/[id]/phases` - Update project phase
```

#### 2. Request Validation

**Content:** Document Zod schema validation pattern

**Example Content:**
```
## Request Validation

All API endpoints use Zod schemas for validation:

1. Define schema in `lib/validations/[resource].ts`
2. Use `.parse()` or `.safeParse()` in API route
3. Return validation errors with 400 status

Example from projects:
[Show GetProjectsQuerySchema and CreateProjectInputSchema examples]
```

#### 3. Response Format

**Content:** Document ApiResponse<T> type structure

**Example Content:**
```
## Response Format

All API responses use the ApiResponse<T> type:

Success response:
{
  "data": { ... },
  "error": null
}

Error response:
{
  "data": null,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}

Use helper functions:
- apiSuccess(data) - Create success response
- apiError(message, code?, status?) - Create error response
```

#### 4. Error Handling

**Content:** Document error handling utilities and patterns

**Example Content:**
```
## Error Handling

Error handling pattern:

1. Catch errors in try/catch block
2. Use apiError() utility to format error response
3. Return appropriate HTTP status code

Common status codes:
- 400: Bad Request (validation errors)
- 401: Unauthorized (not authenticated)
- 403: Forbidden (not authorized)
- 404: Not Found
- 500: Internal Server Error

Example:
[Show try/catch example from existing API route]
```

#### 5. Authentication

**Content:** Document getCurrentUser() usage pattern

**Example Content:**
```
## Authentication

API routes requiring authentication:

1. Import getCurrentUser from lib/utils/api
2. Call at beginning of route handler
3. Returns user or throws error

Example:
const user = await getCurrentUser()
// user is guaranteed to exist here or 401 was returned

Access user ID: user.id
```

#### 6. Database Queries

**Content:** Document Supabase client patterns

**Example Content:**
```
## Database Queries

Database access pattern:

1. Import createClient from lib/supabase/server
2. Create client instance
3. Use Supabase query builder
4. Rely on RLS policies for authorization

Example:
const supabase = await createClient()
const { data, error } = await supabase
  .from('projects')
  .select('*')
  .eq('id', id)
  .single()

Note: RLS policies handle authorization automatically
```

#### 7. Complete Example Endpoint

**Content:** Full example showing all patterns together

**Example Content:**
```
## Complete Example

Here's a complete example endpoint showing all patterns:

[Include full code example from an existing endpoint like GET /api/projects/[id]]

This example demonstrates:
✓ Route parameter extraction
✓ User authentication
✓ Query parameter validation
✓ Database query with Supabase
✓ Error handling
✓ Response formatting
```

## Purpose

This documentation serves as:

1. **Onboarding Material** - New team members can quickly understand API conventions
2. **Reference Guide** - Developers can copy patterns when building new features
3. **Consistency Tool** - Ensures all API endpoints follow the same patterns
4. **Reduce Code Review Time** - Reviewers can point to documented patterns

## Implementation Note

The documentation should be created by:
1. Reading existing API route files (e.g., `/api/projects/route.ts`, `/api/projects/[id]/route.ts`)
2. Extracting the patterns used
3. Creating clear, concise documentation with examples
4. Keeping it practical and focused on "how to" rather than theory

No new API endpoints are created in this spec - only documentation of existing patterns.
