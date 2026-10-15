-- Migration: Cleanup orphaned dependencies in user stories
-- Created: 2025-12-15
-- Description: Remove dependency references to user stories that no longer exist

-- ============================================================================
-- CLEANUP ORPHANED DEPENDENCIES
-- ============================================================================

-- This will remove story IDs from dependencies arrays if those stories don't exist
UPDATE user_stories
SET dependencies = (
  SELECT COALESCE(
    jsonb_agg(dep_id),
    '[]'::jsonb
  )
  FROM jsonb_array_elements_text(dependencies) AS dep_id
  WHERE EXISTS (
    SELECT 1 FROM user_stories AS us WHERE us.id = dep_id::uuid
  )
)
WHERE dependencies IS NOT NULL
  AND dependencies != '[]'::jsonb
  AND jsonb_typeof(dependencies) = 'array';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Query to verify cleanup - should return 0 rows if successful
-- This finds any stories that still have dependencies pointing to non-existent stories
SELECT
  us.id,
  us.title,
  us.dependencies,
  (
    SELECT jsonb_agg(dep_id)
    FROM jsonb_array_elements_text(us.dependencies) AS dep_id
    WHERE NOT EXISTS (
      SELECT 1 FROM user_stories AS us2 WHERE us2.id = dep_id::uuid
    )
  ) as orphaned_deps
FROM user_stories us
WHERE dependencies != '[]'::jsonb
  AND EXISTS (
    SELECT 1
    FROM jsonb_array_elements_text(us.dependencies) AS dep_id
    WHERE NOT EXISTS (
      SELECT 1 FROM user_stories AS us2 WHERE us2.id = dep_id::uuid
    )
  );

-- ============================================================================
-- SUMMARY STATISTICS
-- ============================================================================

-- Show how many stories had orphaned dependencies cleaned up
DO $$
DECLARE
  stories_updated INTEGER;
BEGIN
  SELECT COUNT(*) INTO stories_updated
  FROM user_stories
  WHERE dependencies IS NOT NULL
    AND dependencies != '[]'::jsonb;

  RAISE NOTICE 'Cleanup complete. % user stories with dependencies checked.', stories_updated;
END $$;
