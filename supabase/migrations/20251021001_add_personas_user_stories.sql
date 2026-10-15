-- Migration: Add personas and user_stories tables
-- Created: 2025-10-21
-- Description: Creates tables for persona and user story artifacts with RLS policies

-- ============================================================================
-- PERSONAS TABLE
-- ============================================================================

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

-- Indexes for personas
CREATE INDEX idx_personas_project_id ON personas(project_id);
CREATE INDEX idx_personas_project_created ON personas(project_id, created_at DESC);

-- Enable RLS on personas
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;

-- RLS Policies for personas
CREATE POLICY "Users can view personas from their projects"
  ON personas FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create personas in their projects"
  ON personas FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can update personas in their projects"
  ON personas FOR UPDATE
  USING (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete personas in their projects"
  ON personas FOR DELETE
  USING (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- USER STORIES TABLE
-- ============================================================================

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

-- Indexes for user_stories
CREATE INDEX idx_user_stories_project_id ON user_stories(project_id);
CREATE INDEX idx_user_stories_project_priority ON user_stories(project_id, priority, status);

-- Enable RLS on user_stories
ALTER TABLE user_stories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_stories
CREATE POLICY "Users can view user stories from their projects"
  ON user_stories FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create user stories in their projects"
  ON user_stories FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can update user stories in their projects"
  ON user_stories FOR UPDATE
  USING (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete user stories in their projects"
  ON user_stories FOR DELETE
  USING (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================

-- Create or replace the update_updated_at_column function
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
