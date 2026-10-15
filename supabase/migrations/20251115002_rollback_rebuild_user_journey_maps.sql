-- Migration: Rollback rebuild of user_journey_maps
-- Created: 2025-11-15
-- Description: Rollback to old user_journey_maps structure

-- ============================================================================
-- DROP NEW TABLES
-- ============================================================================

DROP TABLE IF EXISTS user_journey_map_timeline CASCADE;
DROP TABLE IF EXISTS user_journey_maps CASCADE;

-- Drop the validation function
DROP FUNCTION IF EXISTS validate_journey_map_has_stories() CASCADE;

-- ============================================================================
-- RESTORE OLD USER JOURNEY MAPS TABLE
-- ============================================================================

CREATE TABLE user_journey_maps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) <= 200),
  description TEXT CHECK (char_length(description) <= 2000),

  -- Required persona reference (exactly 1 persona)
  -- Note: UUID without foreign key constraint
  persona_id UUID NOT NULL,

  -- Required user story references (1 to n user stories)
  -- Stored as UUID array
  user_story_ids UUID[] NOT NULL DEFAULT '{}',

  -- Journey stages stored as JSONB array
  stages JSONB NOT NULL DEFAULT '[]'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),

  -- Ensure at least one user story is selected
  CONSTRAINT user_story_ids_not_empty CHECK (array_length(user_story_ids, 1) > 0)
);

-- Indexes for user_journey_maps
CREATE INDEX idx_user_journey_maps_project_id ON user_journey_maps(project_id);
CREATE INDEX idx_user_journey_maps_project_created ON user_journey_maps(project_id, created_at DESC);
CREATE INDEX idx_user_journey_maps_persona_id ON user_journey_maps(persona_id);
CREATE INDEX idx_user_journey_maps_user_story_ids ON user_journey_maps USING GIN (user_story_ids);

-- Enable RLS on user_journey_maps
ALTER TABLE user_journey_maps ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_journey_maps
CREATE POLICY "Users can view journey maps from their projects"
  ON user_journey_maps FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create journey maps in their projects"
  ON user_journey_maps FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can update journey maps in their projects"
  ON user_journey_maps FOR UPDATE
  USING (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete journey maps in their projects"
  ON user_journey_maps FOR DELETE
  USING (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

-- Trigger for user_journey_maps
CREATE TRIGGER update_user_journey_maps_updated_at
  BEFORE UPDATE ON user_journey_maps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE user_journey_maps IS 'User journey maps showing the steps a user takes to accomplish a goal';
COMMENT ON COLUMN user_journey_maps.stages IS 'Array of journey stages with actions, thoughts, emotions, pain points, and touchpoints (JSONB)';
COMMENT ON COLUMN user_journey_maps.persona_id IS 'Required reference to the persona this journey map is based on (UUID, foreign key can be added later)';
COMMENT ON COLUMN user_journey_maps.user_story_ids IS 'Required array of user story references (1 to n user stories)';