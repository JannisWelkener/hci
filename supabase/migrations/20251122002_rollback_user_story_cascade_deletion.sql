-- Rollback: User Story Cascade Deletion Support
-- Created: 2025-11-22
-- Description: Removes indexes and cascade deletion function

-- ============================================================================
-- DROP FUNCTION
-- ============================================================================
DROP FUNCTION IF EXISTS delete_user_story_with_cascade(UUID, UUID);

-- ============================================================================
-- DROP INDEXES
-- ============================================================================
-- Note: Dropping indexes is optional as they don't hurt performance
-- But included for complete rollback capability

DROP INDEX IF EXISTS idx_ujmt_user_story_id;
DROP INDEX IF EXISTS idx_ujmt_journey_map_id;
DROP INDEX IF EXISTS idx_ujm_project_id;
