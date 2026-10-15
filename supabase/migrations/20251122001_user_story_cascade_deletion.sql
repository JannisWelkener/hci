-- Migration: User Story Cascade Deletion Support
-- Created: 2025-11-22
-- Description: Adds indexes and cascade deletion function for user stories with journey map dependencies

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================
-- Index for finding journey maps by user story (for dependency check)
CREATE INDEX IF NOT EXISTS idx_ujmt_user_story_id
ON user_journey_map_timeline(user_story_id);

-- Index for finding timeline entries by journey map (for cleanup)
CREATE INDEX IF NOT EXISTS idx_ujmt_journey_map_id
ON user_journey_map_timeline(journey_map_id);

-- Composite index for project-scoped queries (for future optimization)
CREATE INDEX IF NOT EXISTS idx_ujm_project_id
ON user_journey_maps(project_id);

-- ============================================================================
-- CASCADE DELETION FUNCTION
-- ============================================================================
-- Function to handle atomic cascade deletion of user stories and dependent journey maps
-- Returns JSON with deletion statistics for client-side feedback

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
  -- Step 1: Verify the user story exists and belongs to the project
  SELECT EXISTS(
    SELECT 1 FROM user_stories
    WHERE id = p_story_id AND project_id = p_project_id
  ) INTO v_story_exists;

  IF NOT v_story_exists THEN
    RAISE EXCEPTION 'User story not found or does not belong to this project'
      USING ERRCODE = 'P0001';
  END IF;

  -- Step 2: Find all journey maps that reference this story
  SELECT ARRAY_AGG(DISTINCT journey_map_id)
  INTO v_journey_map_ids
  FROM user_journey_map_timeline
  WHERE user_story_id = p_story_id;

  -- Step 3: Delete all timeline entries for this user story
  -- (This happens automatically via ON DELETE CASCADE, but we do it explicitly for counting)
  DELETE FROM user_journey_map_timeline
  WHERE user_story_id = p_story_id;

  GET DIAGNOSTICS v_timeline_entry_count = ROW_COUNT;

  -- Step 4: Delete all affected journey maps
  IF v_journey_map_ids IS NOT NULL AND array_length(v_journey_map_ids, 1) > 0 THEN
    DELETE FROM user_journey_maps
    WHERE id = ANY(v_journey_map_ids)
      AND project_id = p_project_id;

    GET DIAGNOSTICS v_journey_map_count = ROW_COUNT;
  END IF;

  -- Step 5: Delete the user story itself
  DELETE FROM user_stories
  WHERE id = p_story_id
    AND project_id = p_project_id;

  -- Step 6: Return the deletion statistics
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
    -- Log the error and re-raise it for transaction rollback
    RAISE NOTICE 'Error in delete_user_story_with_cascade: %', SQLERRM;
    RAISE;
END;
$$;

-- Add function documentation
COMMENT ON FUNCTION delete_user_story_with_cascade(UUID, UUID) IS
'Deletes a user story and cascades the deletion to all dependent journey maps and timeline entries. Returns JSON with deletion statistics.';

-- ============================================================================
-- PERMISSIONS
-- ============================================================================
-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user_story_with_cascade(UUID, UUID) TO authenticated;

-- Revoke from public for security
REVOKE EXECUTE ON FUNCTION delete_user_story_with_cascade(UUID, UUID) FROM public;
