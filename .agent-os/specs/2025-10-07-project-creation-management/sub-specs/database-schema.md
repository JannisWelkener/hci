# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-10-07-project-creation-management/spec.md

## Overview

This schema implements the database layer for the project creation and management system in HCI Hub. The changes enable multi-user collaboration on HCI projects while tracking progress through all four phases of the HCI lifecycle (Understand Context, Specify Requirements, Produce Design Solutions, Evaluate Against Requirements).

Key enhancements:
- New `project_members` table for team collaboration
- Enhanced phase tracking using JSONB to track status of all phases simultaneously
- Additional project metadata (start_date)
- Updated Row Level Security policies to allow project members (not just owners) to access projects

## Schema Changes

### 1. New Table: project_members

This table manages the many-to-many relationship between users and projects, enabling team collaboration.

```sql
-- Create project_members table
CREATE TABLE IF NOT EXISTS public.project_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

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
```

### 2. Update Table: projects

Add new columns to support enhanced phase tracking and project metadata.

```sql
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
```

### 3. Indexes

Additional indexes for optimizing queries on the new columns.

```sql
-- Index on start_date for date-based queries and sorting
CREATE INDEX IF NOT EXISTS idx_projects_start_date ON public.projects(start_date);

-- GIN index on phase_status JSONB column for efficient JSON queries
CREATE INDEX IF NOT EXISTS idx_projects_phase_status ON public.projects USING GIN (phase_status);
```

### 4. Row Level Security Policies

Updated RLS policies to allow project members (not just owners) to access and modify projects based on their role.

```sql
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;

-- Enable RLS on projects table (if not already enabled)
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
CREATE POLICY "Only owners can delete projects"
ON public.projects
FOR DELETE
USING (auth.uid() = user_id);

-- Enable RLS on project_members table
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view members of projects they have access to
CREATE POLICY "Users can view members of accessible projects"
ON public.project_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_members.project_id
    AND (
      projects.user_id = auth.uid()
      OR
      EXISTS (
        SELECT 1 FROM public.project_members pm
        WHERE pm.project_id = projects.id
        AND pm.user_id = auth.uid()
      )
    )
  )
);

-- Policy: Only project owners can add members
CREATE POLICY "Only owners can add project members"
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
CREATE POLICY "Only owners can update project members"
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
CREATE POLICY "Only owners can remove project members"
ON public.project_members
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_members.project_id
    AND projects.user_id = auth.uid()
  )
);
```

### 5. Triggers

Add triggers to automatically update timestamps.

```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for project_members table
DROP TRIGGER IF EXISTS update_project_members_updated_at ON public.project_members;
CREATE TRIGGER update_project_members_updated_at
  BEFORE UPDATE ON public.project_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for projects table (if not already exists)
DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Complete SQL Migration

```sql
-- =====================================================
-- Migration: Project Creation and Management System
-- Date: 2025-10-07
-- Description: Adds team collaboration and enhanced phase tracking
-- =====================================================

BEGIN;

-- =====================================================
-- 1. CREATE NEW TABLES
-- =====================================================

-- Create project_members table
CREATE TABLE IF NOT EXISTS public.project_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT valid_role CHECK (role IN ('owner', 'editor', 'viewer', 'member')),
  CONSTRAINT unique_project_user UNIQUE (project_id, user_id)
);

-- =====================================================
-- 2. UPDATE EXISTING TABLES
-- =====================================================

-- Add new columns to projects table
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT CURRENT_DATE;

ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS phase_status JSONB DEFAULT '{
  "understand_context": "not_started",
  "specify_requirements": "not_started",
  "produce_design_solutions": "not_started",
  "evaluate_against_requirements": "not_started"
}'::jsonb;

-- Add constraint for phase_status validation
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

-- =====================================================
-- 3. CREATE INDEXES
-- =====================================================

-- Indexes for project_members
CREATE INDEX idx_project_members_project_id ON public.project_members(project_id);
CREATE INDEX idx_project_members_user_id ON public.project_members(user_id);
CREATE INDEX idx_project_members_role ON public.project_members(role);

-- Indexes for new projects columns
CREATE INDEX IF NOT EXISTS idx_projects_start_date ON public.projects(start_date);
CREATE INDEX IF NOT EXISTS idx_projects_phase_status ON public.projects USING GIN (phase_status);

-- =====================================================
-- 4. ADD DOCUMENTATION COMMENTS
-- =====================================================

COMMENT ON TABLE public.project_members IS 'Manages team members and their roles within HCI projects';
COMMENT ON COLUMN public.project_members.role IS 'User role: owner (full control), editor (can edit), viewer (read-only), member (default access)';
COMMENT ON COLUMN public.project_members.joined_at IS 'Timestamp when user was added to the project';
COMMENT ON COLUMN public.projects.start_date IS 'Date when the project was started';
COMMENT ON COLUMN public.projects.phase_status IS 'JSONB object tracking the status of all four HCI lifecycle phases';

-- =====================================================
-- 5. CREATE/UPDATE TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for project_members
DROP TRIGGER IF EXISTS update_project_members_updated_at ON public.project_members;
CREATE TRIGGER update_project_members_updated_at
  BEFORE UPDATE ON public.project_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for projects (if not exists)
DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. UPDATE ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;

-- Enable RLS on projects table
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Projects policies
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

CREATE POLICY "Authenticated users can create projects"
ON public.projects
FOR INSERT
WITH CHECK (auth.uid() = user_id);

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

CREATE POLICY "Only owners can delete projects"
ON public.projects
FOR DELETE
USING (auth.uid() = user_id);

-- Enable RLS on project_members table
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- Project members policies
CREATE POLICY "Users can view members of accessible projects"
ON public.project_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_members.project_id
    AND (
      projects.user_id = auth.uid()
      OR
      EXISTS (
        SELECT 1 FROM public.project_members pm
        WHERE pm.project_id = projects.id
        AND pm.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Only owners can add project members"
ON public.project_members
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_members.project_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Only owners can update project members"
ON public.project_members
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_members.project_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Only owners can remove project members"
ON public.project_members
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_members.project_id
    AND projects.user_id = auth.uid()
  )
);

COMMIT;
```

## Rationale

### 1. project_members Table Design

**Why a separate table?**
- Enables many-to-many relationship between users and projects
- Allows flexible team collaboration without modifying the core projects table
- Supports role-based access control (owner, editor, viewer, member)
- Maintains clean separation of concerns

**Role definitions:**
- `owner`: Full control (inherited from projects.user_id, or explicitly set)
- `editor`: Can modify project content but not manage members
- `viewer`: Read-only access to project data
- `member`: Default role with standard access (can be customized based on business logic)

**Indexes rationale:**
- `project_id` index: Fast lookups when fetching all members of a project
- `user_id` index: Fast lookups when fetching all projects for a user
- `role` index: Efficient filtering by role (e.g., finding all editors)

### 2. Enhanced Phase Tracking with JSONB

**Why JSONB over separate columns/tables?**
- Single atomic unit: All phase statuses updated together
- Flexible structure: Easy to query individual phases or all at once
- Efficient storage: PostgreSQL JSONB is highly optimized
- Future-proof: Easy to add phase metadata (completion dates, notes) without schema changes

**Alternative considered (separate table):**
We could create a `project_phases` table with rows for each phase, but JSONB is better because:
- Simpler queries (no joins needed)
- Guaranteed data consistency (all phases always present)
- Better performance for common operations (fetching all phase statuses)

**GIN Index on phase_status:**
Enables efficient queries like:
```sql
-- Find projects in a specific phase
SELECT * FROM projects WHERE phase_status->>'understand_context' = 'in_progress';
```

### 3. start_date Field

**Why separate from created_at?**
- `created_at`: When the database record was created (technical timestamp)
- `start_date`: When the project actually started (business date, user-controlled)
- Allows backdating projects or setting future start dates
- More intuitive for users (no time component needed)

### 4. Row Level Security Design

**Multi-layered access control:**
1. **SELECT**: Owner OR member can view
2. **INSERT**: Any authenticated user can create (becomes owner automatically)
3. **UPDATE**: Owner OR editor/member can modify
4. **DELETE**: Only owner can delete (prevents accidental data loss)

**project_members access control:**
- Only project owners can manage team members
- All project members can view the member list
- Prevents unauthorized team modifications

**Security benefits:**
- Database-level enforcement (cannot be bypassed by application bugs)
- Automatic filtering of results based on user context
- No need for manual permission checks in application code

### 5. Triggers for Timestamp Management

**Automatic updated_at handling:**
- Ensures timestamps are always accurate
- Removes burden from application code
- Prevents inconsistent timestamp updates
- Works regardless of which client/service modifies the data

### 6. Foreign Key Cascades

**ON DELETE CASCADE for project_members:**
- When a project is deleted, all member associations are automatically removed
- When a user is deleted, all their memberships are removed
- Maintains referential integrity without orphaned records
- Simplifies cleanup logic in application code

### 7. Constraints for Data Integrity

**valid_role CHECK constraint:**
- Ensures only predefined roles can be assigned
- Prevents typos or invalid role values
- Database-level validation (more reliable than application-only validation)

**valid_phase_status CHECK constraint:**
- Ensures all four phases are always present
- Validates that status values are within allowed set
- Prevents partial or corrupted phase tracking data

**unique_project_user constraint:**
- Prevents duplicate memberships
- Ensures clean membership list
- Avoids confusion about user's role in a project

## Migration Notes

1. **Backward Compatibility**: The migration adds new columns with defaults, so existing projects will work seamlessly
2. **Existing Data**: All existing projects will have:
   - `start_date` set to current date (can be updated manually if needed)
   - `phase_status` initialized with all phases as 'not_started'
3. **RLS Updates**: Existing projects remain accessible to their owners; they can now add team members
4. **Performance**: New indexes are created concurrently (in production, use `CREATE INDEX CONCURRENTLY`)
5. **Rollback**: To rollback, drop the constraints, indexes, triggers, policies, and new columns (or use a DOWN migration)

## Future Considerations

1. **Audit Trail**: Consider adding a `project_member_history` table to track when members join/leave
2. **Invitations**: May need a `project_invitations` table for pending member invites
3. **Phase Metadata**: The JSONB structure allows adding completion dates and notes per phase:
   ```json
   {
     "understand_context": {
       "status": "completed",
       "completed_at": "2025-10-05",
       "notes": "User research completed"
     }
   }
   ```
4. **Analytics**: Consider materialized views for project statistics and member activity
