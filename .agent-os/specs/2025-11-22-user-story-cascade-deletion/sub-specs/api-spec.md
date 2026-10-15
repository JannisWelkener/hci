# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-11-22-user-story-cascade-deletion/spec.md

## Endpoints

### GET /api/projects/[id]/user-stories/[storyId]/journey-map-dependencies

**Purpose:** Check if a user story is referenced in any user journey maps and return the list of affected journey maps.

**Authentication:** Required (Supabase Auth)

**Authorization:** User must have access to the project (checked via RLS policies)

**Path Parameters:**
- `id` (string, required): The project UUID
- `storyId` (string, required): The user story UUID

**Response Format (Success - 200 OK):**
```json
{
  "data": {
    "journeyMaps": [
      {
        "id": "uuid-string",
        "title": "Customer Onboarding Journey",
        "created_at": "2025-11-20T10:30:00Z",
        "persona_id": "uuid-string"
      },
      {
        "id": "uuid-string",
        "title": "Purchase Flow Journey",
        "created_at": "2025-11-19T14:20:00Z",
        "persona_id": "uuid-string"
      }
    ],
    "count": 2
  },
  "error": null
}
```

**Response Format (No Dependencies - 200 OK):**
```json
{
  "data": {
    "journeyMaps": [],
    "count": 0
  },
  "error": null
}
```

**Errors:**
- `401 Unauthorized`: User not authenticated
- `403 Forbidden`: User does not have access to this project
- `404 Not Found`: User story or project not found
- `500 Internal Server Error`: Database query failed

**Implementation Details:**
```sql
-- Query to fetch affected journey maps
SELECT DISTINCT
  ujm.id,
  ujm.title,
  ujm.created_at,
  ujm.persona_id
FROM user_journey_map_timeline ujmt
INNER JOIN user_journey_maps ujm ON ujmt.journey_map_id = ujm.id
WHERE ujmt.user_story_id = $storyId
  AND ujm.project_id = $projectId
ORDER BY ujm.created_at DESC;
```

---

### DELETE /api/projects/[id]/user-stories/[storyId]

**Purpose:** Delete a user story and cascade delete all dependent journey maps.

**Authentication:** Required (Supabase Auth)

**Authorization:** User must have editor or owner role in the project (checked via RLS policies)

**Path Parameters:**
- `id` (string, required): The project UUID
- `storyId` (string, required): The user story UUID to delete

**Enhanced Response Format (Success - 200 OK):**
```json
{
  "data": {
    "message": "User story deleted successfully",
    "cascadeDeleted": {
      "journeyMaps": 2,
      "timelineEntries": 3
    }
  },
  "error": null
}
```

**Response Format (No Dependencies - 200 OK):**
```json
{
  "data": {
    "message": "User story deleted successfully",
    "cascadeDeleted": {
      "journeyMaps": 0,
      "timelineEntries": 0
    }
  },
  "error": null
}
```

**Errors:**
- `401 Unauthorized`: User not authenticated
- `403 Forbidden`: User does not have delete permission for this project
- `404 Not Found`: User story not found
- `500 Internal Server Error`: Transaction failed or database error

**Implementation Algorithm:**

1. **Begin Transaction**
2. **Verify Access**: Check user has permission to delete (RLS will handle this)
3. **Find Dependent Journey Maps**:
   ```sql
   SELECT DISTINCT journey_map_id
   FROM user_journey_map_timeline
   WHERE user_story_id = $storyId;
   ```
4. **Delete Timeline Entries**:
   ```sql
   DELETE FROM user_journey_map_timeline
   WHERE user_story_id = $storyId;
   ```
5. **Delete Journey Maps**:
   ```sql
   DELETE FROM user_journey_maps
   WHERE id IN (journey_map_ids_from_step_3);
   ```
6. **Delete User Story**:
   ```sql
   DELETE FROM user_stories
   WHERE id = $storyId AND project_id = $projectId;
   ```
7. **Commit Transaction**
8. **Return Success Response** with count of deleted records

**Transaction Handling:**
- Use Supabase's `rpc()` function to execute a database function that performs all deletions in a single transaction
- If any deletion fails, entire transaction is rolled back
- Ensure ACID properties are maintained

---

## Database Function (Recommended Approach)

Create a PostgreSQL function to handle the cascade deletion atomically:

```sql
CREATE OR REPLACE FUNCTION delete_user_story_with_cascade(
  p_story_id UUID,
  p_project_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_journey_map_count INTEGER;
  v_timeline_entry_count INTEGER;
  v_journey_map_ids UUID[];
BEGIN
  -- Find all journey maps that reference this story
  SELECT ARRAY_AGG(DISTINCT journey_map_id)
  INTO v_journey_map_ids
  FROM user_journey_map_timeline
  WHERE user_story_id = p_story_id;

  -- Delete timeline entries
  DELETE FROM user_journey_map_timeline
  WHERE user_story_id = p_story_id;
  GET DIAGNOSTICS v_timeline_entry_count = ROW_COUNT;

  -- Delete journey maps
  IF v_journey_map_ids IS NOT NULL THEN
    DELETE FROM user_journey_maps
    WHERE id = ANY(v_journey_map_ids)
      AND project_id = p_project_id;
    GET DIAGNOSTICS v_journey_map_count = ROW_COUNT;
  ELSE
    v_journey_map_count := 0;
  END IF;

  -- Delete the user story
  DELETE FROM user_stories
  WHERE id = p_story_id
    AND project_id = p_project_id;

  -- Return counts
  RETURN json_build_object(
    'journeyMaps', v_journey_map_count,
    'timelineEntries', v_timeline_entry_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Usage in API Route:**
```typescript
const { data, error } = await supabase
  .rpc('delete_user_story_with_cascade', {
    p_story_id: storyId,
    p_project_id: projectId
  })
```

---

## Integration with Existing Hooks

### Frontend Hook Changes

**File:** `lib/hooks/use-user-stories.ts`

**Add new hook after line 445:**
```typescript
export function useUserStoryJourneyMapDependencies(
  projectId: string,
  storyId: string
) {
  return useQuery({
    queryKey: [...userStoryKeys.all, 'journey-dependencies', projectId, storyId],
    queryFn: async () => {
      const res = await fetch(
        `/api/projects/${projectId}/user-stories/${storyId}/journey-map-dependencies`
      )
      if (!res.ok) throw new Error('Failed to fetch dependencies')
      const data: ApiResponse<{
        journeyMaps: Array<{ id: string; title: string; created_at: string }>;
        count: number;
      }> = await res.json()
      if (data.error) throw new Error(data.error.message)
      return data.data!
    },
    enabled: !!projectId && !!storyId,
  })
}
```

**Update `useDeleteUserStory` hook** to handle cascade deletion response (lines 306-357).
