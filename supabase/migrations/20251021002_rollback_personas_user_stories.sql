-- Rollback Migration: Remove personas and user_stories tables
-- Created: 2025-10-21
-- Description: Safely removes personas and user_stories tables

-- Drop triggers
DROP TRIGGER IF EXISTS update_user_stories_updated_at ON user_stories;
DROP TRIGGER IF EXISTS update_personas_updated_at ON personas;

-- Drop tables (cascade handles indexes and policies automatically)
DROP TABLE IF EXISTS user_stories CASCADE;
DROP TABLE IF EXISTS personas CASCADE;

-- Note: We keep the update_updated_at_column() function as it may be used by other tables
-- If you need to remove it completely, uncomment the line below:
-- DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
