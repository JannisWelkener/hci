# API Patterns Documentation

This document describes the established API patterns used throughout the HCI Hub application. Follow these conventions when building new API endpoints to maintain consistency across the codebase.

## Table of Contents

1. [Route Structure](#route-structure)
2. [Request Validation](#request-validation)
3. [Response Format](#response-format)
4. [Error Handling](#error-handling)
5. [Authentication](#authentication)
6. [Database Queries](#database-queries)
7. [Complete Example](#complete-example)

---

## Route Structure

API routes follow RESTful conventions using Next.js App Router's file-based routing in the `app/api/` directory.

### Collection Routes

- **GET** `/api/[resource]` - List all resources (with optional query params)
- **POST** `/api/[resource]` - Create new resource

### Individual Resource Routes

- **GET** `/api/[resource]/[id]` - Get single resource
- **PATCH** `/api/[resource]/[id]` - Update resource
- **DELETE** `/api/[resource]/[id]` - Delete resource

### Nested Resource Routes

For related entities (e.g., project members, phases):

- **POST** `/api/[resource]/[id]/[subresource]` - Add related entity
- **PATCH** `/api/[resource]/[id]/[subresource]` - Update related entity
- **DELETE** `/api/[resource]/[id]/[subresource]/[subId]` - Remove related entity

### Examples

```
/api/projects              # GET (list), POST (create)
/api/projects/[id]         # GET (read), PATCH (update), DELETE (delete)
/api/projects/[id]/members # POST (add member)
/api/projects/[id]/members/[userId] # DELETE (remove member)
/api/projects/[id]/phases  # PATCH (update phase status)
```

---

## Request Validation

All API endpoints use **Zod schemas** for request validation to ensure type safety and data integrity.

### Validation Pattern

1. Define Zod schemas in `lib/validations/[resource].ts`
2. Use `.safeParse()` for validation in API routes
3. Return 400 error for validation failures

### Example Schema Definition

```typescript
// lib/validations/project.ts
import { z } from 'zod'

export const createProjectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  start_date: z.string().datetime(),
  current_phase: z.enum([
    'understand_context',
    'specify_requirements',
    'produce_design_solutions',
    'evaluate_against_requirements',
  ]),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>
```

### Example Validation in API Route

```typescript
// Parse and validate request body
const body = await request.json()
const parseResult = createProjectSchema.safeParse(body)

if (!parseResult.success) {
  return errorResponse(
    `Invalid request body: ${parseResult.error.issues.map(e => e.message).join(', ')}`,
    400
  )
}

const validatedData = parseResult.data
```

---

## Response Format

All API responses use the `ApiResponse<T>` type for consistency.

### Success Response Structure

```typescript
{
  "data": { ...actualData },
  "error": null
}
```

### Error Response Structure

```typescript
{
  "data": null,
  "error": {
    "message": "Description of the error",
    "code": "ERROR_CODE"  // optional
  }
}
```

### Helper Functions

Use these utility functions from `lib/utils/api.ts`:

```typescript
import { successResponse, errorResponse } from '@/lib/utils/api'

// Success response
return successResponse(projectData)

// Error response
return errorResponse('Project not found', 404)

// Error with code
return errorResponse('Validation failed', 400, 'VALIDATION_ERROR')
```

---

## Error Handling

All API routes should implement consistent error handling patterns.

### Standard Error Handling Pattern

```typescript
export async function GET(request: NextRequest) {
  try {
    // Authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return errorResponse('Unauthorized', 401)
    }

    // Validation
    const parseResult = schema.safeParse(data)
    if (!parseResult.success) {
      return errorResponse('Validation failed', 400)
    }

    // Database operation
    const { data, error } = await supabase.from('table').select()

    if (error) {
      console.error('Database error:', error)
      return errorResponse('Failed to fetch data', 500)
    }

    return successResponse(data)

  } catch (error) {
    console.error('Unexpected error:', error)
    return errorResponse('Internal server error', 500)
  }
}
```

### Common HTTP Status Codes

- **200 OK** - Successful GET, PATCH request
- **201 Created** - Successful POST request
- **400 Bad Request** - Validation errors, invalid input
- **401 Unauthorized** - Not authenticated
- **403 Forbidden** - Authenticated but not authorized
- **404 Not Found** - Resource doesn't exist
- **500 Internal Server Error** - Unexpected server errors

---

## Authentication

All protected API routes must verify user authentication using Supabase Auth.

### Authentication Pattern

```typescript
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  // Verify authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return errorResponse('Unauthorized', 401)
  }

  // Now user.id is available for queries
  const userId = user.id

  // ... rest of route handler
}
```

### Accessing User Information

Once authenticated, access user data:

```typescript
const userId = user.id           // User's unique ID
const userEmail = user.email     // User's email
const userMetadata = user.user_metadata  // Additional user data
```

---

## Database Queries

Database access uses the Supabase client with Row-Level Security (RLS) policies.

### Database Query Pattern

```typescript
import { createClient } from '@/lib/supabase/server'

const supabase = await createClient()

// Simple select
const { data, error } = await supabase
  .from('projects')
  .select('*')

// Select with filters
const { data, error } = await supabase
  .from('projects')
  .select('*')
  .eq('current_phase', 'understand_context')
  .ilike('name', '%search%')

// Select single row
const { data, error } = await supabase
  .from('projects')
  .select('*')
  .eq('id', projectId)
  .single()

// Insert
const { data, error } = await supabase
  .from('projects')
  .insert({ ...projectData })
  .select()
  .single()

// Update
const { data, error } = await supabase
  .from('projects')
  .update({ name: 'New Name' })
  .eq('id', projectId)
  .select()
  .single()

// Delete
const { data, error } = await supabase
  .from('projects')
  .delete()
  .eq('id', projectId)
```

### Important Notes

- **RLS Policies Handle Authorization**: Supabase RLS policies automatically filter queries based on the authenticated user
- **Always Check for Errors**: Database operations can fail, always check the `error` object
- **Use `.select()`** after insert/update to get the created/updated data
- **Use `.single()`** when expecting exactly one row

---

## Complete Example

Here's a complete example showing all patterns together:

```typescript
// app/api/projects/[id]/route.ts
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { successResponse, errorResponse } from '@/lib/utils/api'
import { updateProjectSchema } from '@/lib/validations/project'

/**
 * GET /api/projects/[id]
 * Get a single project by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // 1. Authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return errorResponse('Unauthorized', 401)
    }

    // 2. Database Query (RLS handles authorization)
    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()

    // 3. Error Handling
    if (error) {
      console.error('Error fetching project:', error)
      if (error.code === 'PGRST116') {
        return errorResponse('Project not found', 404)
      }
      return errorResponse('Failed to fetch project', 500)
    }

    // 4. Success Response
    return successResponse(project)

  } catch (error) {
    console.error('Unexpected error:', error)
    return errorResponse('Internal server error', 500)
  }
}

/**
 * PATCH /api/projects/[id]
 * Update a project
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // 1. Authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return errorResponse('Unauthorized', 401)
    }

    // 2. Request Validation
    const body = await request.json()
    const parseResult = updateProjectSchema.safeParse(body)

    if (!parseResult.success) {
      return errorResponse(
        `Invalid request: ${parseResult.error.issues.map(e => e.message).join(', ')}`,
        400
      )
    }

    const updates = parseResult.data

    // 3. Database Update (RLS handles authorization)
    const { data: project, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    // 4. Error Handling
    if (error) {
      console.error('Error updating project:', error)
      if (error.code === 'PGRST116') {
        return errorResponse('Project not found', 404)
      }
      return errorResponse('Failed to update project', 500)
    }

    // 5. Success Response
    return successResponse(project)

  } catch (error) {
    console.error('Unexpected error:', error)
    return errorResponse('Internal server error', 500)
  }
}
```

### This Example Demonstrates

✅ Route parameter extraction (`params.id`)
✅ User authentication check
✅ Request body validation with Zod
✅ Database queries with Supabase
✅ Comprehensive error handling
✅ Consistent response formatting
✅ Proper TypeScript typing
✅ RLS policy reliance for authorization

---

## Quick Reference Checklist

When creating a new API endpoint, ensure:

- [ ] Route follows RESTful conventions
- [ ] Request validation using Zod schemas
- [ ] User authentication verified
- [ ] Database queries use Supabase client
- [ ] RLS policies configured for authorization
- [ ] Error handling with try/catch
- [ ] Proper HTTP status codes
- [ ] Responses use `successResponse()` / `errorResponse()`
- [ ] TypeScript types are properly defined
- [ ] Errors are logged to console

---

## Additional Resources

- **Validation Schemas**: `lib/validations/`
- **Type Definitions**: `lib/types/database.ts`
- **API Utilities**: `lib/utils/api.ts`
- **Supabase Client**: `lib/supabase/server.ts`
- **Existing Examples**: `app/api/projects/`
