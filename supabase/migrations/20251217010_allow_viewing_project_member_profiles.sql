-- Migration: Allow users to view profiles of people in their projects
-- Created: 2025-12-17
-- Description: Adds RLS policy so users can see names of people in their projects (for notifications)

-- ============================================================================
-- ADD RLS POLICY FOR VIEWING PROJECT MEMBER PROFILES
-- ============================================================================

-- Allow users to view profiles of people in their projects
CREATE POLICY "Users can view profiles of project members"
  ON public.profiles
  FOR SELECT
  USING (
    -- User can view their own profile (existing behavior)
    auth.uid() = id
    OR
    -- OR user can view profiles of people in projects they're in
    EXISTS (
      SELECT 1
      FROM public.project_members pm1
      JOIN public.project_members pm2 ON pm1.project_id = pm2.project_id
      WHERE pm1.user_id = auth.uid()
        AND pm2.user_id = profiles.id
    )
    OR
    -- OR user can view profiles of project owners of projects they're in
    EXISTS (
      SELECT 1
      FROM public.project_members pm
      JOIN public.projects p ON pm.project_id = p.id
      WHERE pm.user_id = auth.uid()
        AND p.user_id = profiles.id
    )
    OR
    -- OR user can view profiles of members in projects they own
    EXISTS (
      SELECT 1
      FROM public.projects p
      JOIN public.project_members pm ON p.id = pm.project_id
      WHERE p.user_id = auth.uid()
        AND pm.user_id = profiles.id
    )
  );

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

COMMENT ON POLICY "Users can view profiles of project members" ON public.profiles IS 'Allows users to view profiles of people in their projects (for notifications and collaboration features)';
