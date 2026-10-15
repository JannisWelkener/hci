# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-11-05-user-stories-management/spec.md

## Existing Schema

The `user_stories` table already exists in the database from migration `20251021001_add_personas_user_stories.sql`. This spec will utilize the existing schema without modifications.

### Table: user_stories

```sql
CREATE TABLE user_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) <= 200),
  user_role TEXT NOT NULL CHECK (char_length(user_role) <= 100),
  action TEXT NOT NULL CHECK (char_length(action) <= 500),
  benefit TEXT NOT NULL CHECK (char_length(benefit) <= 500),
  acceptance_criteria TEXT[],
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'backlog' CHECK (status IN ('backlog', 'in_progress', 'done')),
  story_points INTEGER CHECK (story_points > 0 AND story_points <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);
```

### Indexes

```sql
-- Index for fetching all user stories in a project
CREATE INDEX idx_user_stories_project_id ON user_stories(project_id);

-- Composite index for filtering by priority and status within a project
CREATE INDEX idx_user_stories_project_priority ON user_stories(project_id, priority, status);
```

### Row-Level Security (RLS) Policies

```sql
-- Enable RLS
ALTER TABLE user_stories ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view user stories from their projects
CREATE POLICY "Users can view user stories from their projects"
  ON user_stories FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can create user stories in their projects
CREATE POLICY "Users can create user stories in their projects"
  ON user_stories FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- Policy: Users can update user stories in their projects
CREATE POLICY "Users can update user stories in their projects"
  ON user_stories FOR UPDATE
  USING (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can delete user stories in their projects
CREATE POLICY "Users can delete user stories in their projects"
  ON user_stories FOR DELETE
  USING (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );
```

### Triggers

```sql
-- Trigger to automatically update updated_at timestamp
CREATE TRIGGER update_user_stories_updated_at
  BEFORE UPDATE ON user_stories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Schema Rationale

### Field Constraints

1. **title (max 200 chars)** - Concise story title for list display, enforced at DB level
2. **user_role (max 100 chars)** - User persona or role description (e.g., "student", "instructor")
3. **action (max 500 chars)** - The "I want to..." portion of the user story
4. **benefit (max 500 chars)** - The "so that..." portion explaining the value
5. **acceptance_criteria (TEXT[])** - Flexible array for variable number of criteria
6. **priority (enum)** - Standardized priority levels for consistent filtering and sorting
7. **status (enum)** - Workflow stages with default 'backlog' for new stories
8. **story_points (1-100)** - Standard story point range for agile estimation

### Foreign Key Relationships

- **project_id → projects(id)** - Ensures user stories belong to valid projects, CASCADE delete removes stories when project is deleted
- **created_by → auth.users(id)** - Tracks story creator for audit and attribution

### Index Strategy

- **idx_user_stories_project_id** - Optimizes the most common query (fetch all stories for a project)
- **idx_user_stories_project_priority** - Composite index supports filtering/sorting by priority and status within a project

### RLS Security Model

All policies verify project membership through `project_members` table, ensuring:
- Users can only view stories from projects they're members of
- Users can create stories only in their projects
- Any project member can update/delete stories (collaborative editing)
- Creator tracking via `created_by` field for audit trail

## No Migration Required

Since the database schema already exists and fully supports the feature requirements, no new migration is needed for this spec. The implementation will use the existing `user_stories` table as-is.
