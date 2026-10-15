# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-12-07-user-story-dependency-cleanup/spec.md

## Endpoints

### GET /api/projects/[projectId]/user-stories/[storyId]/incoming-dependencies

**Purpose:** Fetch all user stories that reference the target story in their dependencies array (incoming dependencies)

**Parameters:**
- `projectId` (path parameter, UUID): The project ID
- `storyId` (path parameter, UUID): The target user story ID

**Request Headers:**
- `Authorization`: Supabase session token (handled by middleware)

**Success Response (200 OK):**
```typescript
{
  dependencies: UserStory[],
  count: number
}
```

**UserStory Object Structure:**
```typescript
{
  id: string,
  project_id: string,
  title: string,
  user_role: string,
  action: string,
  benefit: string,
  description: string | null,
  acceptance_criteria: string[] | null,
  priority: 'high' | 'medium' | 'low' | null,
  priority_order: number,
  status: 'to-do' | 'in-progress' | 'done' | 'blocked' | null,
  story_points: number | null,
  dependencies: Dependency[],
  created_at: string,
  updated_at: string,
  created_by: string
}
```

**Dependency Object Structure:**
```typescript
{
  story_id: string,
  type: 'blocks' | 'requires' | 'relates_to'
}
```

**Error Responses:**

- **401 Unauthorized**: User is not authenticated
```typescript
{
  error: "Unauthorized",
  message: "Authentication required"
}
```

- **403 Forbidden**: User doesn't have access to the project
```typescript
{
  error: "Forbidden",
  message: "You do not have access to this project"
}
```

- **404 Not Found**: Story or project doesn't exist
```typescript
{
  error: "Not Found",
  message: "User story not found or does not belong to this project"
}
```

- **500 Internal Server Error**: Database or server error
```typescript
{
  error: "Internal Server Error",
  message: "Failed to fetch incoming dependencies"
}
```

**Query Implementation:**
```sql
-- PostgreSQL query to find incoming dependencies
SELECT * FROM user_stories
WHERE project_id = $1
AND dependencies @> '[{"story_id": $2}]'::jsonb
ORDER BY priority_order ASC, created_at DESC;
```

**Notes:**
- Uses PostgreSQL's JSONB containment operator `@>` for efficient querying
- Returns full story objects to display in deletion dialog
- Sorted by priority order (high priority first) then creation date (newest first)
- Only returns stories from the same project (cross-project dependencies not supported)

---

### DELETE /api/projects/[projectId]/user-stories/[storyId]

**Purpose:** Delete a user story and cascade delete related journey maps, while cleaning up all dependency references

**Parameters:**
- `projectId` (path parameter, UUID): The project ID
- `storyId` (path parameter, UUID): The user story ID to delete

**Request Headers:**
- `Authorization`: Supabase session token (handled by middleware)

**Success Response (200 OK):**
```typescript
{
  success: true,
  deleted: {
    story: true,
    journeyMaps: number,
    timelineEntries: number,
    dependenciesUpdated: number
  }
}
```

**Response Fields:**
- `success`: Always `true` for successful deletion
- `deleted.story`: Always `true` confirming story was deleted
- `deleted.journeyMaps`: Count of journey maps deleted (cascade)
- `deleted.timelineEntries`: Count of timeline entries deleted (cascade)
- `deleted.dependenciesUpdated`: Count of stories that had their dependencies array updated

**Error Responses:**

- **401 Unauthorized**: User is not authenticated
```typescript
{
  error: "Unauthorized",
  message: "Authentication required"
}
```

- **403 Forbidden**: User doesn't have access to the project or doesn't own the story
```typescript
{
  error: "Forbidden",
  message: "You do not have permission to delete this story"
}
```

- **404 Not Found**: Story or project doesn't exist
```typescript
{
  error: "Not Found",
  message: "User story not found or does not belong to this project"
}
```

- **500 Internal Server Error**: Database or server error during deletion
```typescript
{
  error: "Internal Server Error",
  message: "Failed to delete user story"
}
```

**Enhanced Deletion Flow:**

1. **Verify Story Exists**
   ```typescript
   const story = await supabase
     .from('user_stories')
     .select('*')
     .eq('id', storyId)
     .eq('project_id', projectId)
     .single();

   if (!story) throw new Error('Not Found');
   ```

2. **Find Incoming Dependencies**
   ```typescript
   const { data: dependentStories } = await supabase
     .from('user_stories')
     .select('id, dependencies')
     .eq('project_id', projectId)
     .contains('dependencies', [{ story_id: storyId }]);
   ```

3. **Remove Dependency References (Atomic Update)**
   ```typescript
   // For each dependent story, filter out the deleted story from dependencies array
   const updates = dependentStories.map(async (depStory) => {
     const updatedDependencies = depStory.dependencies.filter(
       (dep) => dep.story_id !== storyId
     );

     return supabase
       .from('user_stories')
       .update({ dependencies: updatedDependencies })
       .eq('id', depStory.id);
   });

   await Promise.all(updates);
   ```

4. **Call Cascade Deletion Function**
   ```typescript
   const { data: cascadeResult } = await supabase
     .rpc('delete_user_story_with_cascade', {
       p_story_id: storyId,
       p_project_id: projectId
     });
   ```

5. **Return Enhanced Statistics**
   ```typescript
   return {
     success: true,
     deleted: {
       story: true,
       journeyMaps: cascadeResult.deleted.journeyMaps,
       timelineEntries: cascadeResult.deleted.timelineEntries,
       dependenciesUpdated: dependentStories.length
     }
   };
   ```

**Transaction Safety:**
- All dependency cleanup operations MUST complete before calling cascade deletion
- Use Supabase transactions to ensure atomicity
- If any step fails, roll back all changes
- Return appropriate error response with rollback confirmation

**Performance Optimization:**
- Use batch updates for dependency cleanup instead of individual updates
- Utilize PostgreSQL's JSONB manipulation functions:
  ```sql
  UPDATE user_stories
  SET dependencies = (
    SELECT jsonb_agg(dep)
    FROM jsonb_array_elements(dependencies) AS dep
    WHERE dep->>'story_id' != $1
  )
  WHERE project_id = $2
  AND dependencies @> '[{"story_id": $1}]'::jsonb;
  ```
- This single query updates all dependent stories efficiently

**Cache Invalidation:**
After successful deletion, invalidate React Query caches for:
- `user-stories-${projectId}` (stories list)
- `user-story-${storyId}` (individual story)
- `user-story-dependencies-${storyId}` (dependencies)
- `user-story-incoming-dependencies-${storyId}` (new cache key)
- `user-story-journey-map-dependencies-${storyId}` (existing)

---

## Database Operations

### JSONB Query for Incoming Dependencies

**Purpose:** Find all stories that contain a specific story ID in their dependencies array

**Query:**
```sql
SELECT * FROM user_stories
WHERE project_id = $1
AND dependencies @> '[{"story_id": $2}]'::jsonb;
```

**Explanation:**
- `@>` is the JSONB containment operator
- Checks if the dependencies array contains any object with the matching story_id
- Efficient with GIN index on dependencies column (if created)

**Index Recommendation (Optional Performance Optimization):**
```sql
CREATE INDEX idx_user_stories_dependencies ON user_stories USING GIN (dependencies);
```

### Batch Dependency Cleanup

**Purpose:** Remove a deleted story's ID from all stories' dependencies arrays in a single query

**Query:**
```sql
UPDATE user_stories
SET dependencies = (
  SELECT jsonb_agg(dep)
  FROM jsonb_array_elements(dependencies) AS dep
  WHERE dep->>'story_id' != $1
)
WHERE project_id = $2
AND dependencies @> '[{"story_id": $1}]'::jsonb
RETURNING id;
```

**Explanation:**
- Uses `jsonb_array_elements` to expand the dependencies array
- Filters out objects where `story_id` matches the deleted story
- Aggregates the filtered results back into an array with `jsonb_agg`
- Only updates stories that actually contain the reference (performance optimization)
- Returns the IDs of updated stories for statistics

**Transaction Example:**
```typescript
const { data, error } = await supabase.rpc('cleanup_story_dependencies', {
  p_deleted_story_id: storyId,
  p_project_id: projectId
});
```

---

## Error Handling Strategy

### Client-Side Error Handling

**Hook Error States:**
```typescript
const { data, error, isLoading } = useUserStoryIncomingDependencies(projectId, storyId);

if (error) {
  // Show error toast notification
  toast.error('Failed to load dependent stories');
  // Still allow deletion (degraded experience)
}
```

**Deletion Error Handling:**
```typescript
try {
  await deleteStory.mutateAsync();
  toast.success('Story deleted successfully');
} catch (error) {
  if (error.message.includes('dependencies')) {
    toast.error('Failed to clean up dependencies. Please try again.');
  } else {
    toast.error('Failed to delete story. Please try again.');
  }
}
```

### Server-Side Error Handling

**Validation Errors:**
- Invalid UUID format → 400 Bad Request
- Story not found → 404 Not Found
- Permission denied → 403 Forbidden

**Database Errors:**
- Transaction rollback on any failure
- Log detailed error for debugging
- Return generic error message to client
- Track failed deletions for monitoring

**Rollback Strategy:**
If dependency cleanup succeeds but cascade deletion fails:
1. Roll back dependency updates
2. Return error to client
3. Log the failure with context
4. Preserve data integrity (no partial deletions)

---

## Testing Scenarios

### API Endpoint Tests

1. **Test: Fetch incoming dependencies for story with no dependencies**
   - Expected: `{ dependencies: [], count: 0 }`

2. **Test: Fetch incoming dependencies for story with multiple dependent stories**
   - Expected: Array of dependent stories sorted by priority

3. **Test: Fetch incoming dependencies for non-existent story**
   - Expected: 404 Not Found

4. **Test: Fetch incoming dependencies for story in different project**
   - Expected: 404 Not Found (security check)

5. **Test: Delete story with incoming dependencies**
   - Expected: Dependencies cleaned up, story deleted, correct statistics returned

6. **Test: Delete story with both incoming dependencies and journey maps**
   - Expected: Both cleaned up, correct statistics for both types

7. **Test: Transaction rollback when cascade deletion fails**
   - Expected: Dependency updates rolled back, error returned

8. **Test: Performance with 100+ dependent stories**
   - Expected: Deletion completes in < 2 seconds
