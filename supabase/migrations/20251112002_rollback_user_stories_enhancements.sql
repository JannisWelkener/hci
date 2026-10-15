-- Rollback Migration: Remove user stories enhancement columns
-- Created: 2025-11-12
-- Description: Safely removes description, priority_order, generation_method, and dependencies columns from user_stories table

-- ============================================================================
-- DROP INDEXES
-- ============================================================================

DROP INDEX IF EXISTS idx_user_stories_priority_order;
DROP INDEX IF EXISTS idx_user_stories_project_priority_order;
DROP INDEX IF EXISTS idx_user_stories_dependencies;
DROP INDEX IF EXISTS idx_user_stories_generation_method;

-- ============================================================================
-- DROP CONSTRAINTS
-- ============================================================================

ALTER TABLE user_stories
DROP CONSTRAINT IF EXISTS valid_dependencies_structure;

-- ============================================================================
-- DROP COLUMNS
-- ============================================================================

ALTER TABLE user_stories
DROP COLUMN IF EXISTS description,
DROP COLUMN IF EXISTS priority_order,
DROP COLUMN IF EXISTS generation_method,
DROP COLUMN IF EXISTS dependencies;
