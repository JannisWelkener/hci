-- Migration: Fix Cascade Deletion for Simplified Dependencies
-- Created: 2025-12-15
-- Description: Updates delete_user_story_with_cascade() to work with simplified dependency structure (string arrays instead of object arrays)

-- ============================================================================
-- UPDATED CASCADE DELETION FUNCTION FOR SIMPLIFIED DEPENDENCIES
-- ============================================================================

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
  v_dependencies_updated_count INTEGER := 0;
  v_journey_map_ids UUID[];
  v_story_exists BOOLEAN;
BEGIN
  -- Step 1: Verify the user story exists and belongs to the project
  SELECT EXISTS(
    SELECT 1 FROM user_stories
    WHERE id = p_story_id AND project_id = p_project_id
  ) INTO v_story_exists;

  IF NOT v_story_exists THEN
    RAISE EXCEPTION 'User story not found or does not belong to this project'
      USING ERRCODE = 'P0001';
  END IF;

  -- Step 2: Clean up incoming dependency references (UPDATED FOR SIMPLIFIED FORMAT)
  -- Find all stories that reference this story in their dependencies array
  -- and remove the reference
  -- Dependencies are now simple strings, not objects
  UPDATE user_stories
  SET dependencies = (
    SELECT COALESCE(jsonb_agg(dep_id), '[]'::jsonb)
    FROM jsonb_array_elements_text(dependencies) AS dep_id
    WHERE dep_id::uuid != p_story_id
  )
  WHERE project_id = p_project_id
    AND dependencies @> to_jsonb(ARRAY[p_story_id::text]);

  -- Get the count of stories that were updated
  GET DIAGNOSTICS v_dependencies_updated_count = ROW_COUNT;

  -- Step 3: Find all journey maps that reference this story
  SELECT ARRAY_AGG(DISTINCT journey_map_id)
  INTO v_journey_map_ids
  FROM user_journey_map_timeline
  WHERE user_story_id = p_story_id;

  -- Step 4: Delete all timeline entries for this user story
  -- (This happens automatically via ON DELETE CASCADE, but we do it explicitly for counting)
  DELETE FROM user_journey_map_timeline
  WHERE user_story_id = p_story_id;

  GET DIAGNOSTICS v_timeline_entry_count = ROW_COUNT;

  -- Step 5: Delete all affected journey maps
  IF v_journey_map_ids IS NOT NULL AND array_length(v_journey_map_ids, 1) > 0 THEN
    DELETE FROM user_journey_maps
    WHERE id = ANY(v_journey_map_ids)
      AND project_id = p_project_id;

    GET DIAGNOSTICS v_journey_map_count = ROW_COUNT;
  END IF;

  -- Step 6: Delete the user story itself
  DELETE FROM user_stories
  WHERE id = p_story_id
    AND project_id = p_project_id;

  -- Step 7: Return the deletion and update statistics
  RETURN json_build_object(
    'success', true,
    'deleted', json_build_object(
      'story', true,
      'journeyMaps', v_journey_map_count,
      'timelineEntries', v_timeline_entry_count
    ),
    'updated', json_build_object(
      'dependenciesUpdated', v_dependencies_updated_count
    )
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Log the error and re-raise it for transaction rollback
    RAISE NOTICE 'Error in delete_user_story_with_cascade: %', SQLERRM;
    RAISE;
END;
$$;

-- Update function documentation
COMMENT ON FUNCTION delete_user_story_with_cascade(UUID, UUID) IS
'Deletes a user story and cascades the deletion to all dependent journey maps and timeline entries.
Also removes all incoming dependency references from other stories that depend on the deleted story.
Works with simplified dependency structure (array of story ID strings).
Returns JSON with deletion and update statistics.';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- This function now correctly handles the simplified dependency format:
-- OLD: [{"story_id": "uuid-1", "type": "blocks"}]
-- NEW: ["uuid-1"]

-- Example return value:
-- {
--   "success": true,
--   "deleted": {
--     "story": true,
--     "journeyMaps": 2,
--     "timelineEntries": 3
--   },
--   "updated": {
--     "dependenciesUpdated": 4
--   }
-- }
