-- Rollback Migration: Remove foreign key relationship between project_members and profiles
-- Date: 2025-12-16
-- Description: Removes the foreign key constraint

ALTER TABLE public.project_members
DROP CONSTRAINT IF EXISTS fk_project_members_profile;
