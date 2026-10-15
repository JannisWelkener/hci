-- Validation Queries for User Story Priority Order Migration
-- Date: 2025-12-06
-- Purpose: Verify priority_order values are sequential (1, 2, 3...) with no gaps or duplicates

-- Query 1: Check for gaps in priority_order sequences
-- Expected: 0 rows (no gaps)
WITH ordered_stories AS (
  SELECT project_id,
         priority_order,
         LAG(priority_order) OVER (PARTITION BY project_id ORDER BY priority_order) as prev_order
  FROM user_stories
)
SELECT project_id,
       priority_order,
       prev_order,
       priority_order - prev_order as gap_size
FROM ordered_stories
WHERE prev_order IS NOT NULL
  AND priority_order != prev_order + 1
ORDER BY project_id, priority_order;

-- Query 2: Check for duplicate priority_order within projects
-- Expected: 0 rows (no duplicates)
SELECT project_id, priority_order, COUNT(*) as duplicate_count
FROM user_stories
GROUP BY project_id, priority_order
HAVING COUNT(*) > 1
ORDER BY project_id, priority_order;

-- Query 3: Verify sequential ordering (priority_order should equal row number)
-- Expected: 0 rows (all stories have correct sequential order)
WITH numbered_stories AS (
  SELECT project_id,
         id,
         priority_order,
         ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY priority_order) as expected_order
  FROM user_stories
)
SELECT project_id,
       id,
       priority_order,
       expected_order,
       priority_order - expected_order as difference
FROM numbered_stories
WHERE priority_order != expected_order
ORDER BY project_id, priority_order;

-- Query 4: Check that all projects start at priority_order = 1
-- Expected: All projects should have min_order = 1
SELECT project_id,
       MIN(priority_order) as min_order,
       MAX(priority_order) as max_order,
       COUNT(*) as story_count,
       MAX(priority_order) - COUNT(*) + 1 as expected_min
FROM user_stories
GROUP BY project_id
HAVING MIN(priority_order) != 1
ORDER BY project_id;

-- Query 5: Summary statistics per project
-- Expected: For each project, max_order should equal story_count
SELECT project_id,
       COUNT(*) as story_count,
       MIN(priority_order) as min_order,
       MAX(priority_order) as max_order,
       CASE
         WHEN MIN(priority_order) = 1 AND MAX(priority_order) = COUNT(*) THEN 'VALID'
         ELSE 'INVALID'
       END as validation_status
FROM user_stories
GROUP BY project_id
ORDER BY project_id;

-- Query 6: Overall migration status
-- Expected: All projects should be VALID
WITH numbered_stories AS (
  SELECT project_id,
         priority_order,
         ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY priority_order) as expected_order
  FROM user_stories
)
SELECT
  COUNT(DISTINCT project_id) as total_projects,
  COUNT(*) as total_stories,
  SUM(CASE WHEN priority_order = expected_order THEN 1 ELSE 0 END) as correctly_ordered,
  COUNT(*) - SUM(CASE WHEN priority_order = expected_order THEN 1 ELSE 0 END) as incorrectly_ordered
FROM numbered_stories;
