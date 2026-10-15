-- Migration: Simplify user story dependencies
-- Created: 2025-12-08
-- Description: Convert dependencies from array of objects to array of story IDs

-- ============================================================================
-- TRANSFORM DEPENDENCIES STRUCTURE
-- ============================================================================

-- Transform dependencies from [{story_id, type}] to [story_id]
-- Extract story_id from each dependency object and rebuild as simple array
UPDATE user_stories
SET dependencies = (
  SELECT jsonb_agg(dep->>'story_id')
  FROM jsonb_array_elements(dependencies) AS dep
)
WHERE dependencies IS NOT NULL
  AND dependencies != '[]'::jsonb
  AND jsonb_typeof(dependencies) = 'array';

-- ============================================================================
-- VALIDATION
-- ============================================================================

-- Add simple constraint to ensure dependencies is an array
-- Note: More complex validation (UUID format, etc.) is handled at application level
ALTER TABLE user_stories
DROP CONSTRAINT IF EXISTS valid_dependencies_structure;

ALTER TABLE user_stories
ADD CONSTRAINT valid_dependencies_structure
  CHECK (jsonb_typeof(dependencies) = 'array');

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================

-- Query to verify migration success
-- SELECT
--   id,
--   title,
--   dependencies,
--   jsonb_array_length(dependencies) as dep_count
-- FROM user_stories
-- WHERE dependencies IS NOT NULL AND dependencies != '[]'::jsonb
-- LIMIT 10;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN user_stories.dependencies IS 'JSONB array of user story IDs that this story depends on (simplified from object structure)';
