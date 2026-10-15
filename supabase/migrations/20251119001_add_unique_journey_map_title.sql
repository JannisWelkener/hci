-- Migration: Add unique constraint for journey map titles within a project
-- Created: 2025-11-19
-- Description: Ensures that journey map titles are unique within each project

-- Add unique constraint on (project_id, title)
-- Using LOWER() to ensure case-insensitive uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS unique_journey_map_title_per_project
ON user_journey_maps (project_id, LOWER(TRIM(title)));

-- Add comment for documentation
COMMENT ON INDEX unique_journey_map_title_per_project IS
'Ensures journey map titles are unique within each project (case-insensitive)';
