-- Rollback Migration: Remove project_invitations table
-- Date: 2025-12-16
-- Description: Removes project_invitations table and associated objects

-- Drop function
DROP FUNCTION IF EXISTS public.accept_project_invitation(TEXT, UUID);

-- Drop table (CASCADE will remove all dependent objects like indexes, triggers, etc.)
DROP TABLE IF EXISTS public.project_invitations CASCADE;
