-- Migration: Fix infinite recursion in project_members and projects RLS policies
-- Created: 2025-12-09
-- Description: Break circular dependency by simplifying to ownership-only checks

BEGIN;

-- ============================================================================
-- SOLUTION: Simplify both policies to ONLY check ownership
-- Members see projects through app-level filtering, not RLS
-- ============================================================================

-- ============================================================================
-- Step 1: Simplify project_members RLS - Only owners and self
-- ============================================================================

DROP POLICY IF EXISTS "Users can view project members" ON public.project_members;

-- Users can view members ONLY if they own the project OR it's their own record
CREATE POLICY "Users can view project members"
ON public.project_members
FOR SELECT
USING (
  -- This is the user's own membership record
  project_members.user_id = auth.uid()
  OR
  -- User owns the project (simple column check, no subquery)
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_members.project_id
      AND p.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Project owners can add members" ON public.project_members;
CREATE POLICY "Project owners can add members"
ON public.project_members
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_members.project_id
      AND p.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Project owners and self can remove members" ON public.project_members;
CREATE POLICY "Project owners and self can remove members"
ON public.project_members
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_members.project_id
      AND p.user_id = auth.uid()
  )
  OR project_members.user_id = auth.uid()
);

DROP POLICY IF EXISTS "Project owners can update members" ON public.project_members;
CREATE POLICY "Project owners can update members"
ON public.project_members
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_members.project_id
      AND p.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_members.project_id
      AND p.user_id = auth.uid()
  )
);

-- ============================================================================
-- Step 2: Add projects RLS - Owner OR direct membership check
-- ============================================================================

DROP POLICY IF EXISTS "Users can view projects they have access to" ON public.projects;
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view projects where they are members" ON public.projects;

-- Policy 1: View own projects
CREATE POLICY "Users can view their own projects"
ON public.projects
FOR SELECT
USING (auth.uid() = user_id);

-- Policy 2: View projects where user is a member
-- This is safe because it directly checks project_members with user_id (no recursion)
-- When this queries project_members, that table's RLS only checks projects.user_id or self
CREATE POLICY "Users can view projects where they are members"
ON public.projects
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.project_members pm
    WHERE pm.project_id = projects.id
      AND pm.user_id = auth.uid()
  )
);

COMMIT;
