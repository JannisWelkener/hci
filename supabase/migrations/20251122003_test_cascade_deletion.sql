-- Test Script: User Story Cascade Deletion Function
-- Created: 2025-11-22
-- Description: Test the delete_user_story_with_cascade function with sample data
-- IMPORTANT: This is a test file - DO NOT apply to production!
-- Run this in a transaction and ROLLBACK to avoid affecting real data

-- ============================================================================
-- TEST SETUP
-- ============================================================================
-- This script demonstrates how to test the cascade deletion function
-- Run these commands in your Supabase SQL Editor wrapped in a transaction

BEGIN;

-- ============================================================================
-- EXAMPLE 1: Test with a user story that has journey map dependencies
-- ============================================================================
-- Replace these UUIDs with actual values from your database

-- Find a user story that's referenced in journey maps
-- Run this query first to get a story_id and project_id:
/*
SELECT
  us.id as story_id,
  us.project_id,
  us.title as story_title,
  COUNT(DISTINCT ujmt.journey_map_id) as journey_map_count
FROM user_stories us
INNER JOIN user_journey_map_timeline ujmt ON us.id = ujmt.user_story_id
GROUP BY us.id, us.project_id, us.title
HAVING COUNT(DISTINCT ujmt.journey_map_id) > 0
LIMIT 1;
*/

-- Then test the cascade deletion function:
-- SELECT delete_user_story_with_cascade(
--   'your-story-uuid-here'::UUID,
--   'your-project-uuid-here'::UUID
-- );

-- Expected result format:
-- {
--   "success": true,
--   "deleted": {
--     "story": true,
--     "journeyMaps": 2,
--     "timelineEntries": 3
--   }
-- }

-- ============================================================================
-- EXAMPLE 2: Test with a user story that has NO dependencies
-- ============================================================================
-- Find a user story with no journey map references:
/*
SELECT
  us.id as story_id,
  us.project_id,
  us.title as story_title
FROM user_stories us
LEFT JOIN user_journey_map_timeline ujmt ON us.id = ujmt.user_story_id
WHERE ujmt.id IS NULL
LIMIT 1;
*/

-- Then test the cascade deletion function:
-- SELECT delete_user_story_with_cascade(
--   'your-story-uuid-here'::UUID,
--   'your-project-uuid-here'::UUID
-- );

-- Expected result:
-- {
--   "success": true,
--   "deleted": {
--     "story": true,
--     "journeyMaps": 0,
--     "timelineEntries": 0
--   }
-- }

-- ============================================================================
-- EXAMPLE 3: Test error handling - non-existent story
-- ============================================================================
-- This should raise an exception:
-- SELECT delete_user_story_with_cascade(
--   'ffffffff-ffff-ffff-ffff-ffffffffffff'::UUID,
--   'your-project-uuid-here'::UUID
-- );

-- Expected: Exception with message "User story not found or does not belong to this project"

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- After running the cascade deletion, verify the results:

-- Check that the user story was deleted:
-- SELECT * FROM user_stories WHERE id = 'your-story-uuid-here';
-- Expected: 0 rows

-- Check that timeline entries were deleted:
-- SELECT * FROM user_journey_map_timeline WHERE user_story_id = 'your-story-uuid-here';
-- Expected: 0 rows

-- Check that journey maps were deleted:
-- SELECT * FROM user_journey_maps WHERE id IN ('journey-map-uuid-1', 'journey-map-uuid-2');
-- Expected: 0 rows

-- ============================================================================
-- ROLLBACK TO PREVENT ACTUAL DELETION DURING TESTING
-- ============================================================================
-- IMPORTANT: Always rollback when testing!
ROLLBACK;

-- To actually apply deletions in production, replace ROLLBACK with COMMIT
-- But only do this when you're certain!
