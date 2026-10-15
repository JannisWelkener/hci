-- Rollback Migration: Remove unique constraint for journey map titles
-- Created: 2025-11-19
-- Description: Removes the unique constraint on journey map titles

-- Drop the unique index
DROP INDEX IF EXISTS unique_journey_map_title_per_project;
