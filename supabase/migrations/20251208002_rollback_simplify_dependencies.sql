-- Rollback Migration: Restore dependency type structure
-- Created: 2025-12-08
-- Description: Convert dependencies back from simple array to object array with default type

-- ============================================================================
-- RESTORE DEPENDENCIES STRUCTURE
-- ============================================================================

-- Transform dependencies from [story_id] back to [{story_id, type}]
-- Use 'requires' as default type for all dependencies
UPDATE user_stories
SET dependencies = (
  SELECT jsonb_agg(
    jsonb_build_object(
      'story_id', story_id,
      'type', 'requires'
    )
  )
  FROM jsonb_array_elements_text(dependencies) AS story_id
)
WHERE dependencies IS NOT NULL
  AND dependencies != '[]'::jsonb
  AND jsonb_typeof(dependencies) = 'array';

-- ============================================================================
-- VALIDATION
-- ============================================================================

-- Restore original constraint
ALTER TABLE user_stories
DROP CONSTRAINT IF EXISTS valid_dependencies_structure;

ALTER TABLE user_stories
ADD CONSTRAINT valid_dependencies_structure
  CHECK (jsonb_typeof(dependencies) = 'array');

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN user_stories.dependencies IS 'JSONB array of dependency objects with story_id and type (blocks, requires, relates_to)';
