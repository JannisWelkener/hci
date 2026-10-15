-- Migration: Enhance projects table for team collaboration and comprehensive phase tracking
-- Date: 2025-10-07
-- Description: Adds project_members table, phase_status JSONB tracking, and updates RLS policies

-- ============================================================================
-- 1. Create project_members table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.project_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_role CHECK (role IN ('owner', 'editor', 'viewer', 'member')),
  CONSTRAINT unique_project_user UNIQUE (project_id, user_id)
);

-- Add indexes for performance
CREATE INDEX idx_project_members_project_id ON public.project_members(project_id);
CREATE INDEX idx_project_members_user_id ON public.project_members(user_id);
CREATE INDEX idx_project_members_role ON public.project_members(role);

-- Add comments for documentation
COMMENT ON TABLE public.project_members IS 'Manages team members and their roles within HCI projects';
COMMENT ON COLUMN public.project_members.role IS 'User role: owner (full control), editor (can edit), viewer (read-only), member (default access)';
COMMENT ON COLUMN public.project_members.joined_at IS 'Timestamp when user was added to the project';

-- ============================================================================
-- 2. Enhance projects table
-- ============================================================================

-- Add start_date column
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT CURRENT_DATE;

-- Add phase_status JSONB column for tracking all phases
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS phase_status JSONB DEFAULT '{
  "understand_context": "not_started",
  "specify_requirements": "not_started",
  "produce_design_solutions": "not_started",
  "evaluate_against_requirements": "not_started"
}'::jsonb;

-- Add constraint to ensure phase_status has valid values
ALTER TABLE public.projects
ADD CONSTRAINT valid_phase_status CHECK (
  phase_status ? 'understand_context' AND
  phase_status ? 'specify_requirements' AND
  phase_status ? 'produce_design_solutions' AND
  phase_status ? 'evaluate_against_requirements' AND
  phase_status->>'understand_context' IN ('not_started', 'in_progress', 'completed') AND
  phase_status->>'specify_requirements' IN ('not_started', 'in_progress', 'completed') AND
  phase_status->>'produce_design_solutions' IN ('not_started', 'in_progress', 'completed') AND
  phase_status->>'evaluate_against_requirements' IN ('not_started', 'in_progress', 'completed')
);

-- Add comments for documentation
COMMENT ON COLUMN public.projects.start_date IS 'Date when the project was started';
COMMENT ON COLUMN public.projects.phase_status IS 'JSONB object tracking the status of all four HCI lifecycle phases';

-- ============================================================================
-- 3. Add additional indexes
-- ============================================================================

-- Index on start_date for date-based queries and sorting
CREATE INDEX IF NOT EXISTS idx_projects_start_date ON public.projects(start_date);

-- GIN index on phase_status JSONB column for efficient JSON queries
CREATE INDEX IF NOT EXISTS idx_projects_phase_status ON public.projects USING GIN (phase_status);

-- ============================================================================
-- 4. Create trigger for updated_at on project_members
-- ============================================================================

CREATE TRIGGER set_project_members_updated_at
  BEFORE UPDATE ON public.project_members
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 5. Row Level Security for project_members
-- ============================================================================

-- Enable RLS on project_members table
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view members of projects they have access to
CREATE POLICY "Users can view project members"
ON public.project_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_members.project_id
    AND (
      projects.user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.project_members pm
        WHERE pm.project_id = projects.id
        AND pm.user_id = auth.uid()
      )
    )
  )
);

-- Policy: Only project owners can add members
CREATE POLICY "Project owners can add members"
ON public.project_members
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_members.project_id
    AND projects.user_id = auth.uid()
  )
);

-- Policy: Only project owners can update member roles
CREATE POLICY "Project owners can update member roles"
ON public.project_members
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_members.project_id
    AND projects.user_id = auth.uid()
  )
);

-- Policy: Only project owners can remove members
CREATE POLICY "Project owners can remove members"
ON public.project_members
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_members.project_id
    AND projects.user_id = auth.uid()
  )
);

-- ============================================================================
-- 6. Update RLS policies for projects table
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;

-- Ensure RLS is enabled
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view projects they own OR are members of
CREATE POLICY "Users can view projects they have access to"
ON public.projects
FOR SELECT
USING (
  auth.uid() = user_id
  OR
  EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_members.project_id = projects.id
    AND project_members.user_id = auth.uid()
  )
);

-- Policy: Authenticated users can create projects (they become the owner)
CREATE POLICY "Authenticated users can create projects"
ON public.projects
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update projects they own OR are editors/members
CREATE POLICY "Users can update projects they have edit access to"
ON public.projects
FOR UPDATE
USING (
  auth.uid() = user_id
  OR
  EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_members.project_id = projects.id
    AND project_members.user_id = auth.uid()
    AND project_members.role IN ('owner', 'editor', 'member')
  )
)
WITH CHECK (
  auth.uid() = user_id
  OR
  EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_members.project_id = projects.id
    AND project_members.user_id = auth.uid()
    AND project_members.role IN ('owner', 'editor', 'member')
  )
);

-- Policy: Only project owners can delete projects
CREATE POLICY "Only project owners can delete projects"
ON public.projects
FOR DELETE
USING (auth.uid() = user_id);
