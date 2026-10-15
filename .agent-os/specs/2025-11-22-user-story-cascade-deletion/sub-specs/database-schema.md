# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-11-22-user-story-cascade-deletion/spec.md

## Overview

This specification does not require modifications to existing database tables. The necessary relationships already exist through the `user_journey_map_timeline` junction table that connects user stories to journey maps. However, we will add:

1. A database function to handle cascade deletion atomically
2. Indexes to optimize dependency queries (if not already present)

## Database Changes

### 1. Index Creation (Performance Optimization)

Check and create indexes on the `user_journey_map_timeline` table to optimize dependency queries:

```sql
-- Index for finding journey maps by user story (for dependency check)
CREATE INDEX IF NOT EXISTS idx_ujmt_user_story_id
ON user_journey_map_timeline(user_story_id);

-- Index for finding timeline entries by journey map (for cleanup)
CREATE INDEX IF NOT EXISTS idx_ujmt_journey_map_id
ON user_journey_map_timeline(journey_map_id);

-- Composite index for project-scoped queries (optional, for future optimization)
CREATE INDEX IF NOT EXISTS idx_ujm_project_id
ON user_journey_maps(project_id);
```

**Rationale:** These indexes significantly improve the performance of:
- Dependency detection queries (finding journey maps for a given story)
- Cascade deletion operations (finding all timeline entries to delete)
- Reducing full table scans on large datasets

---

### 2. Cascade Deletion Function

Create a PostgreSQL function to handle the entire cascade deletion operation atomically within a single transaction:

```sql
-- Drop existing function if it exists (for updates/migrations)
DROP FUNCTION IF EXISTS delete_user_story_with_cascade(UUID, UUID);

-- Create the cascade deletion function
CREATE OR REPLACE FUNCTION delete_user_story_with_cascade(
  p_story_id UUID,
  p_project_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_journey_map_count INTEGER := 0;
  v_timeline_entry_count INTEGER := 0;
  v_journey_map_ids UUID[];
  v_story_exists BOOLEAN;
BEGIN
  -- Verify the user story exists and belongs to the project
  SELECT EXISTS(
    SELECT 1 FROM user_stories
    WHERE id = p_story_id AND project_id = p_project_id
  ) INTO v_story_exists;

  IF NOT v_story_exists THEN
    RAISE EXCEPTION 'User story not found or does not belong to this project'
      USING ERRCODE = 'P0001';
  END IF;

  -- Step 1: Find all journey maps that reference this story
  SELECT ARRAY_AGG(DISTINCT journey_map_id)
  INTO v_journey_map_ids
  FROM user_journey_map_timeline
  WHERE user_story_id = p_story_id;

  -- Step 2: Delete all timeline entries for this user story
  DELETE FROM user_journey_map_timeline
  WHERE user_story_id = p_story_id;

  GET DIAGNOSTICS v_timeline_entry_count = ROW_COUNT;

  -- Step 3: Delete all affected journey maps
  IF v_journey_map_ids IS NOT NULL AND array_length(v_journey_map_ids, 1) > 0 THEN
    DELETE FROM user_journey_maps
    WHERE id = ANY(v_journey_map_ids)
      AND project_id = p_project_id;

    GET DIAGNOSTICS v_journey_map_count = ROW_COUNT;
  END IF;

  -- Step 4: Delete the user story itself
  DELETE FROM user_stories
  WHERE id = p_story_id
    AND project_id = p_project_id;

  -- Step 5: Return the deletion statistics
  RETURN json_build_object(
    'success', true,
    'deleted', json_build_object(
      'story', true,
      'journeyMaps', v_journey_map_count,
      'timelineEntries', v_timeline_entry_count
    )
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Log the error and re-raise it
    RAISE NOTICE 'Error in delete_user_story_with_cascade: %', SQLERRM;
    RAISE;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION delete_user_story_with_cascade(UUID, UUID) IS
'Deletes a user story and cascades the deletion to all dependent journey maps and timeline entries. Returns JSON with deletion statistics.';
```

**Function Parameters:**
- `p_story_id`: UUID of the user story to delete
- `p_project_id`: UUID of the project (for security validation)

**Function Returns:**
```json
{
  "success": true,
  "deleted": {
    "story": true,
    "journeyMaps": 2,
    "timelineEntries": 3
  }
}
```

**Security:**
- `SECURITY DEFINER`: Function runs with the privileges of the function owner, allowing it to bypass RLS policies
- Validates that the story belongs to the specified project before deletion
- RLS policies on the API level still control who can call this function

**Error Handling:**
- Raises exception if story doesn't exist or doesn't belong to project
- Transaction automatically rolls back on any error
- Logs errors for debugging

---

### 3. Grant Permissions

Ensure the function can be executed by authenticated users:

```sql
-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user_story_with_cascade(UUID, UUID)
TO authenticated;

-- Revoke from public for security
REVOKE EXECUTE ON FUNCTION delete_user_story_with_cascade(UUID, UUID)
FROM public;
```

---

## Migration Script

Create a Supabase migration file: `supabase/migrations/YYYYMMDDHHMMSS_user_story_cascade_deletion.sql`

```sql
-- Migration: User Story Cascade Deletion Support
-- Description: Adds indexes and cascade deletion function for user stories with journey map dependencies
-- Date: 2025-11-22

BEGIN;

-- 1. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ujmt_user_story_id
ON user_journey_map_timeline(user_story_id);

CREATE INDEX IF NOT EXISTS idx_ujmt_journey_map_id
ON user_journey_map_timeline(journey_map_id);

CREATE INDEX IF NOT EXISTS idx_ujm_project_id
ON user_journey_maps(project_id);

-- 2. Create cascade deletion function
CREATE OR REPLACE FUNCTION delete_user_story_with_cascade(
  p_story_id UUID,
  p_project_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_journey_map_count INTEGER := 0;
  v_timeline_entry_count INTEGER := 0;
  v_journey_map_ids UUID[];
  v_story_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM user_stories
    WHERE id = p_story_id AND project_id = p_project_id
  ) INTO v_story_exists;

  IF NOT v_story_exists THEN
    RAISE EXCEPTION 'User story not found or does not belong to this project'
      USING ERRCODE = 'P0001';
  END IF;

  SELECT ARRAY_AGG(DISTINCT journey_map_id)
  INTO v_journey_map_ids
  FROM user_journey_map_timeline
  WHERE user_story_id = p_story_id;

  DELETE FROM user_journey_map_timeline
  WHERE user_story_id = p_story_id;
  GET DIAGNOSTICS v_timeline_entry_count = ROW_COUNT;

  IF v_journey_map_ids IS NOT NULL AND array_length(v_journey_map_ids, 1) > 0 THEN
    DELETE FROM user_journey_maps
    WHERE id = ANY(v_journey_map_ids)
      AND project_id = p_project_id;
    GET DIAGNOSTICS v_journey_map_count = ROW_COUNT;
  END IF;

  DELETE FROM user_stories
  WHERE id = p_story_id AND project_id = p_project_id;

  RETURN json_build_object(
    'success', true,
    'deleted', json_build_object(
      'story', true,
      'journeyMaps', v_journey_map_count,
      'timelineEntries', v_timeline_entry_count
    )
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in delete_user_story_with_cascade: %', SQLERRM;
    RAISE;
END;
$$;

COMMENT ON FUNCTION delete_user_story_with_cascade(UUID, UUID) IS
'Deletes a user story and cascades the deletion to all dependent journey maps and timeline entries.';

-- 3. Grant permissions
GRANT EXECUTE ON FUNCTION delete_user_story_with_cascade(UUID, UUID) TO authenticated;
REVOKE EXECUTE ON FUNCTION delete_user_story_with_cascade(UUID, UUID) FROM public;

COMMIT;
```

---

## Rollback Script

Create a rollback migration if needed: `supabase/migrations/YYYYMMDDHHMMSS_rollback_user_story_cascade_deletion.sql`

```sql
-- Rollback: User Story Cascade Deletion Support
-- Description: Removes indexes and cascade deletion function

BEGIN;

-- Drop function
DROP FUNCTION IF EXISTS delete_user_story_with_cascade(UUID, UUID);

-- Drop indexes (optional - indexes generally don't hurt performance)
DROP INDEX IF EXISTS idx_ujmt_user_story_id;
DROP INDEX IF EXISTS idx_ujmt_journey_map_id;
DROP INDEX IF EXISTS idx_ujm_project_id;

COMMIT;
```

---

## Data Integrity Considerations

**Existing Tables Affected:**
- `user_stories`: Records will be deleted
- `user_journey_maps`: Dependent records will be cascade deleted
- `user_journey_map_timeline`: Junction table entries will be deleted first

**Foreign Key Constraints:**
The existing schema should have foreign key constraints:
```sql
-- Verify these constraints exist:
ALTER TABLE user_journey_map_timeline
  ADD CONSTRAINT fk_ujmt_user_story
  FOREIGN KEY (user_story_id)
  REFERENCES user_stories(id)
  ON DELETE CASCADE;

ALTER TABLE user_journey_map_timeline
  ADD CONSTRAINT fk_ujmt_journey_map
  FOREIGN KEY (journey_map_id)
  REFERENCES user_journey_maps(id)
  ON DELETE CASCADE;
```

**Note:** If these constraints already have `ON DELETE CASCADE`, the database function provides redundant deletion logic. However, the function approach gives us more control and allows us to return deletion statistics.

---

## Testing Queries

**Check dependency detection:**
```sql
-- Find journey maps for a specific user story
SELECT DISTINCT
  ujm.id, ujm.title, ujm.created_at
FROM user_journey_map_timeline ujmt
INNER JOIN user_journey_maps ujm ON ujmt.journey_map_id = ujm.id
WHERE ujmt.user_story_id = 'story-uuid-here'
  AND ujm.project_id = 'project-uuid-here';
```

**Test cascade deletion function:**
```sql
-- Test deletion (in a transaction for safety)
BEGIN;
SELECT delete_user_story_with_cascade(
  'story-uuid-here'::UUID,
  'project-uuid-here'::UUID
);
ROLLBACK; -- or COMMIT to apply
```
