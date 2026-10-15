-- Rollback Migration: Remove ux_visions table
-- Created: 2026-01-08
-- Description: Drops the ux_visions table and all related objects

-- Drop the trigger
DROP TRIGGER IF EXISTS update_ux_visions_updated_at ON ux_visions;

-- Drop the table (CASCADE will drop related objects like indexes and policies)
DROP TABLE IF EXISTS ux_visions CASCADE;
