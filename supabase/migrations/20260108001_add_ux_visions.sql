-- Migration: Add ux_visions table
-- Created: 2026-01-08
-- Description: Creates table for UX vision statements with RLS policies

-- ============================================================================
-- UX VISIONS TABLE
-- ============================================================================

CREATE TABLE ux_visions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  vision TEXT NOT NULL CHECK (char_length(vision) > 0 AND char_length(vision) <= 5000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  UNIQUE(project_id) -- Each project can have only one UX vision
);

-- Indexes for ux_visions
CREATE INDEX idx_ux_visions_project_id ON ux_visions(project_id);

-- Enable RLS on ux_visions
ALTER TABLE ux_visions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ux_visions
CREATE POLICY "Users can view ux_visions from their projects"
  ON ux_visions FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create ux_visions in their projects"
  ON ux_visions FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can update ux_visions in their projects"
  ON ux_visions FOR UPDATE
  USING (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete ux_visions in their projects"
  ON ux_visions FOR DELETE
  USING (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

-- Trigger to automatically update updated_at on row modification
CREATE TRIGGER update_ux_visions_updated_at
  BEFORE UPDATE ON ux_visions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
