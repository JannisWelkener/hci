# Database Schema

This is the database schema implementation for the spec detailed at `.agent-os/specs/2025-10-21-team-development-foundation/spec.md`

## Schema Changes

### New Tables

#### 1. Personas Table

**Purpose:** Store persona artifacts created during the "Understand Context of Use" phase of ISO 9241-210.

**Table Definition:**
```sql
CREATE TABLE personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) <= 200),
  age INTEGER CHECK (age > 0 AND age < 150),
  role TEXT CHECK (char_length(role) <= 200),
  photo_url TEXT,
  goals TEXT[],
  frustrations TEXT[],
  behaviors TEXT[],
  bio TEXT CHECK (char_length(bio) <= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);
```

**Indexes:**
```sql
CREATE INDEX idx_personas_project_id ON personas(project_id);
CREATE INDEX idx_personas_project_created ON personas(project_id, created_at DESC);
```

**RLS Policies:**
```sql
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;

-- Users can view personas from projects they're members of
CREATE POLICY "Users can view personas from their projects"
  ON personas FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

-- Users can create personas in projects they're members of
CREATE POLICY "Users can create personas in their projects"
  ON personas FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- Users can update personas in projects they're members of
CREATE POLICY "Users can update personas in their projects"
  ON personas FOR UPDATE
  USING (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

-- Users can delete personas in projects they're members of
CREATE POLICY "Users can delete personas in their projects"
  ON personas FOR DELETE
  USING (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );
```

**Rationale:**
- `project_id` foreign key ensures personas belong to a project and cascade delete when project is removed
- Text arrays for `goals`, `frustrations`, `behaviors` allow flexible multi-item storage without additional tables
- `photo_url` stores Supabase Storage URL (actual file upload handled separately)
- `created_by` tracks persona creator for audit trail
- Composite index on `(project_id, created_at)` optimizes common query pattern of listing personas by project

#### 2. User Stories Table

**Purpose:** Store user story artifacts created during requirements specification phase of ISO 9241-210.

**Table Definition:**
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

**Indexes:**
```sql
CREATE INDEX idx_user_stories_project_id ON user_stories(project_id);
CREATE INDEX idx_user_stories_project_priority ON user_stories(project_id, priority, status);
```

**RLS Policies:**
```sql
ALTER TABLE user_stories ENABLE ROW LEVEL SECURITY;

-- Users can view user stories from projects they're members of
CREATE POLICY "Users can view user stories from their projects"
  ON user_stories FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

-- Users can create user stories in projects they're members of
CREATE POLICY "Users can create user stories in their projects"
  ON user_stories FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- Users can update user stories in projects they're members of
CREATE POLICY "Users can update user stories in their projects"
  ON user_stories FOR UPDATE
  USING (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

-- Users can delete user stories in projects they're members of
CREATE POLICY "Users can delete user stories in their projects"
  ON user_stories FOR DELETE
  USING (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );
```

**Rationale:**
- Standard user story format: "As a [user_role], I want to [action], so that [benefit]"
- Separate fields for each component enable better querying and validation
- `acceptance_criteria` as text array allows multiple criteria without separate table
- Enum constraints on `priority` and `status` ensure data consistency
- `story_points` for planning poker / estimation integration
- Composite index on `(project_id, priority, status)` optimizes backlog and sprint queries

### Database Trigger for Updated_at

Both tables need automatic `updated_at` timestamp updates:

```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for personas
CREATE TRIGGER update_personas_updated_at
  BEFORE UPDATE ON personas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for user_stories
CREATE TRIGGER update_user_stories_updated_at
  BEFORE UPDATE ON user_stories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Migration File Structure

**File:** `supabase/migrations/[TIMESTAMP]_add_personas_user_stories.sql`

**Migration Order:**
1. Create `personas` table
2. Create `user_stories` table
3. Create indexes for both tables
4. Enable RLS on both tables
5. Create RLS policies for both tables
6. Create/update `updated_at` trigger function
7. Create triggers for both tables

## Performance Considerations

- Indexes on `project_id` columns essential for foreign key performance
- Composite indexes optimize common query patterns (filtering by project + sorting by date/priority)
- Text arrays avoid JOIN complexity for simple lists
- RLS policies leverage existing `project_members` table without additional queries
- CASCADE deletes prevent orphaned records when projects are removed

## Data Integrity

- Foreign key constraints ensure referential integrity
- CHECK constraints enforce valid data ranges (age, string lengths)
- Enum constraints prevent invalid status/priority values
- NOT NULL constraints on required fields
- RLS policies ensure users only access authorized data
- `created_by` field provides audit trail

## Rollback Strategy

**Rollback File:** `supabase/migrations/[TIMESTAMP]_rollback_personas_user_stories.sql`

```sql
-- Drop triggers
DROP TRIGGER IF EXISTS update_user_stories_updated_at ON user_stories;
DROP TRIGGER IF EXISTS update_personas_updated_at ON personas;

-- Drop tables (cascade handles indexes and policies)
DROP TABLE IF EXISTS user_stories CASCADE;
DROP TABLE IF EXISTS personas CASCADE;

-- Note: Keep update_updated_at_column() function as it may be used by other tables
```
