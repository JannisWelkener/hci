-- Migration: Add user stories enhancement columns
-- Created: 2025-11-12
-- Description: Adds description, priority_order, generation_method, and dependencies columns to user_stories table

-- ============================================================================
-- ADD NEW COLUMNS TO USER_STORIES TABLE
-- ============================================================================

-- Add description column for storing story context and AI generation input
ALTER TABLE user_stories
ADD COLUMN description TEXT DEFAULT NULL;

-- Add priority_order column for explicit drag-and-drop ordering
ALTER TABLE user_stories
ADD COLUMN priority_order INTEGER NOT NULL DEFAULT 0;

-- Add generation_method column to track creation method
ALTER TABLE user_stories
ADD COLUMN generation_method TEXT NOT NULL DEFAULT 'manual'
  CHECK (generation_method IN ('manual', 'ai_generated'));

-- Add dependencies column to store story relationships as JSONB
ALTER TABLE user_stories
ADD COLUMN dependencies JSONB DEFAULT '[]'::jsonb;

-- Add constraint to validate dependencies array structure
ALTER TABLE user_stories
ADD CONSTRAINT valid_dependencies_structure
  CHECK (jsonb_typeof(dependencies) = 'array');

-- ============================================================================
-- BACKFILL PRIORITY_ORDER WITH CALCULATED VALUES
-- ============================================================================

-- Backfill priority_order with calculated values based on priority level and creation time
-- Formula: (priority_level_weight * 1000000) + (epoch_seconds)
-- This ensures high priority items come first, with creation time as tiebreaker
UPDATE user_stories
SET priority_order = (
  CASE priority
    WHEN 'critical' THEN 1000000
    WHEN 'high' THEN 2000000
    WHEN 'medium' THEN 3000000
    WHEN 'low' THEN 4000000
    ELSE 5000000
  END + EXTRACT(EPOCH FROM created_at)::INTEGER
);

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index on priority_order for efficient sorting
CREATE INDEX idx_user_stories_priority_order
ON user_stories(priority_order ASC);

-- Composite index for project_id + priority_order (most common query pattern)
CREATE INDEX idx_user_stories_project_priority_order
ON user_stories(project_id, priority_order ASC);

-- GIN index on dependencies JSONB for efficient dependency lookups
CREATE INDEX idx_user_stories_dependencies
ON user_stories USING GIN (dependencies);

-- Index on generation_method for filtering/analytics
CREATE INDEX idx_user_stories_generation_method
ON user_stories(generation_method);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON COLUMN user_stories.description IS 'Original description or context for the user story, used for AI generation input and documentation';
COMMENT ON COLUMN user_stories.priority_order IS 'Explicit ordering value for drag-and-drop reordering, separate from priority level';
COMMENT ON COLUMN user_stories.generation_method IS 'Tracks how the user story was created: manual entry or AI-generated';
COMMENT ON COLUMN user_stories.dependencies IS 'JSONB array of dependency objects with story_id and type (blocks, requires, relates_to)';
