# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-12-08-simplify-user-story-dependencies/spec.md

## Overview

This specification documents the API changes required to support simplified user story dependencies. The primary change is removing the `type` field from dependency responses and updating request validation to accept string arrays instead of object arrays.

## Modified Endpoints

### GET /api/projects/[id]/user-stories/[storyId]/dependencies

**Purpose:** Retrieve all dependencies for a specific user story (both outgoing and incoming)

**Current Response:**
```typescript
{
  "data": {
    "story": UserStory,
    "outgoing": [
      {
        "story": UserStory,
        "type": "blocks" | "requires" | "relates_to"
      }
    ],
    "incoming": [
      {
        "story": UserStory,
        "type": "blocks" | "requires" | "relates_to"
      }
    ]
  },
  "error": null
}
```

**New Response:**
```typescript
{
  "data": {
    "story": UserStory,
    "outgoing": UserStory[],
    "incoming": UserStory[]
  },
  "error": null
}
```

**Changes Required:**
- Remove `type` field from outgoing and incoming arrays
- Simplify response to just return arrays of UserStory objects
- Update `DependencyResponse` interface in route file
- Modify response building logic (lines 84-90, 105-122)

**File:** `app/api/projects/[id]/user-stories/[storyId]/dependencies/route.ts`

**Updated Implementation:**
```typescript
interface DependencyResponse {
  story: UserStory
  outgoing: UserStory[]
  incoming: UserStory[]
}

// Build outgoing response (simplified)
const outgoing = outgoingStoryIds
  .map(id => outgoingStories.find(s => s.id === id))
  .filter(story => story !== undefined) as UserStory[]

// Build incoming response (simplified)
const incoming: UserStory[] = []
for (const otherStory of (allStories as UserStory[])) {
  if (otherStory.id === storyId) continue

  const deps: string[] = otherStory.dependencies || []
  if (deps.includes(storyId)) {
    incoming.push(otherStory)
  }
}
```

### POST /api/projects/[id]/user-stories

**Purpose:** Create a new user story with dependencies

**Current Request Body:**
```typescript
{
  "title": "string",
  "user_role": "string",
  "action": "string",
  "benefit": "string",
  "dependencies": [
    { "story_id": "uuid", "type": "requires" }
  ]
}
```

**New Request Body:**
```typescript
{
  "title": "string",
  "user_role": "string",
  "action": "string",
  "benefit": "string",
  "dependencies": ["uuid-1", "uuid-2"]
}
```

**Changes Required:**
- Update request validation to accept string array
- No changes to database insertion logic (JSONB accepts both formats)
- Update error messages for dependency validation

**Validation Schema:** See validation changes in technical-spec.md

### PUT /api/projects/[id]/user-stories/[storyId]

**Purpose:** Update an existing user story including dependencies

**Current Request Body:**
```typescript
{
  "dependencies": [
    { "story_id": "uuid", "type": "blocks" }
  ]
}
```

**New Request Body:**
```typescript
{
  "dependencies": ["uuid-1", "uuid-2"]
}
```

**Changes Required:**
- Update request validation to accept string array
- Update partial update logic to handle string array
- Ensure update operations properly replace dependency array

## Response Type Updates

### UserStory Type

**Current:**
```typescript
interface UserStory {
  id: string
  // ... other fields
  dependencies: Dependency[]
}

interface Dependency {
  story_id: string
  type: DependencyType
}

type DependencyType = 'blocks' | 'requires' | 'relates_to'
```

**New:**
```typescript
interface UserStory {
  id: string
  // ... other fields
  dependencies: string[]
}
```

**Impact:**
- All GET endpoints returning UserStory objects will have simplified dependencies field
- No API version bump required (backward compatible from client perspective)
- Clients expecting `type` field will need updates

## Error Responses

### Invalid Dependency UUID

**Status:** 400 Bad Request

**Response:**
```typescript
{
  "data": null,
  "error": {
    "message": "Invalid dependency UUID format at index 2",
    "code": "INVALID_DEPENDENCY_UUID"
  }
}
```

### Dependency Story Not Found

**Status:** 400 Bad Request

**Response:**
```typescript
{
  "data": null,
  "error": {
    "message": "Dependency story with ID abc123... not found in project",
    "code": "DEPENDENCY_NOT_FOUND"
  }
}
```

### Circular Dependency

**Status:** 400 Bad Request

**Response:**
```typescript
{
  "data": null,
  "error": {
    "message": "Cannot add dependency: would create circular reference",
    "code": "CIRCULAR_DEPENDENCY"
  }
}
```

## Backward Compatibility

### Migration Period

During migration, the API may encounter both old and new format dependencies in the database. The migration should be run during low-traffic period.

**Strategy:**
1. Run database migration to convert all existing dependencies
2. Deploy updated API code immediately after migration
3. Update frontend clients to use new format

**No Dual-Format Support:** Given the simplicity of the change, supporting both formats simultaneously adds unnecessary complexity. A coordinated migration is preferred.

### Client Impact

**Breaking Change:** Yes, for clients that read the `type` field from dependency responses

**Mitigation:**
- Frontend and API are deployed together (monorepo)
- No external API consumers
- Single coordinated deployment minimizes impact window

## Validation Rules

### Dependency Array Validation

**Rules:**
1. Must be a valid JSON array
2. Each element must be a valid UUID string
3. Array can be empty (`[]`)
4. No duplicate UUIDs in array
5. All UUIDs must reference existing user stories in same project

**Validation Order:**
1. Schema validation (Zod) - checks array and UUID format
2. Database validation - checks referenced stories exist
3. Business logic validation - checks for circular dependencies (optional)

**Implementation:**
```typescript
// In validation schema
dependencies: z.array(z.string().uuid('Invalid dependency UUID'))
  .optional()
  .default([])
  .transform(val => Array.from(new Set(val))) // Remove duplicates
```

## Testing Recommendations

### API Testing Scenarios

1. **Create Story with Dependencies**
   - POST with valid dependency array
   - POST with invalid UUID in dependencies
   - POST with non-existent story UUID
   - POST with empty dependencies array

2. **Update Story Dependencies**
   - PUT to add dependencies
   - PUT to remove dependencies
   - PUT to replace all dependencies
   - PUT with invalid dependency data

3. **Get Story Dependencies**
   - GET story with no dependencies
   - GET story with multiple dependencies
   - GET story with both incoming and outgoing dependencies
   - GET dependencies for non-existent story

4. **Edge Cases**
   - Story depending on itself (should reject)
   - Circular dependencies A→B→A (optional validation)
   - Dependencies referencing deleted stories (orphaned dependencies)
   - Very large dependency arrays (100+ dependencies)

### Expected Responses

**Successful Create:**
```json
{
  "data": {
    "id": "uuid",
    "title": "Story Title",
    "dependencies": ["uuid-1", "uuid-2"],
    // ... other fields
  },
  "error": null
}
```

**Successful Get Dependencies:**
```json
{
  "data": {
    "story": { /* UserStory object */ },
    "outgoing": [
      { /* UserStory object */ },
      { /* UserStory object */ }
    ],
    "incoming": [
      { /* UserStory object */ }
    ]
  },
  "error": null
}
```

## Performance Considerations

### Response Size Reduction

Removing `type` field reduces JSON response size:
- Old format: `{"story_id": "uuid", "type": "requires"}` ≈ 52 bytes
- New format: `"uuid"` ≈ 36 bytes
- Savings: ~30% per dependency in dependency responses

### Query Performance

No significant change to database query performance:
- Same JSONB queries using GIN index
- Simplified array structure may slightly improve JSON parsing
- No change to query execution plans

## Documentation Updates Required

1. Update API documentation for affected endpoints
2. Update TypeScript type definitions in `lib/types/database.ts`
3. Update validation schema documentation in `lib/validations/user-story.ts`
4. Update component prop type documentation
5. Add migration guide for any external consumers (if applicable)
