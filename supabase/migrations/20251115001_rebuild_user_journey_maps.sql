-- Migration: Rebuild user_journey_maps with proper relations
-- Created: 2025-11-15
-- Description: Drops old table and creates new structure with foreign keys and timeline junction table

-- ============================================================================
-- DROP OLD TABLE
-- ============================================================================

DROP TABLE IF EXISTS user_journey_maps xCASCADE;

-- ============================================================================
-- USER JOURNEY MAPS TABLE (NEW)
-- ============================================================================

CREATE TABLE user_journey_maps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) <= 200),
  description TEXT CHECK (char_length(description) <= 2000),

  -- Required persona reference (exactly 1 persona) with foreign key
  persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,

  -- Flag to indicate if AI optimized the timeline
  ai_optimize_timeline BOOLEAN NOT NULL DEFAULT false,

  -- Journey stages stored as JSONB array
  -- Each stage: { name, description, actions, thoughts, emotions, painPoints, touchpoints }
  stages JSONB NOT NULL DEFAULT '[]'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),

  -- Ensure stages array is not empty
  CONSTRAINT stages_not_empty CHECK (jsonb_array_length(stages) > 0)
);

-- ============================================================================
-- USER JOURNEY MAP TIMELINE TABLE (NEW)
-- ============================================================================
-- Junction table to track which user stories are in the timeline and their order
-- Allows duplicate stories at different positions

CREATE TABLE user_journey_map_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_map_id UUID NOT NULL REFERENCES user_journey_maps(id) ON DELETE CASCADE,
  user_story_id UUID NOT NULL REFERENCES user_stories(id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK (position >= 0),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Ensure unique position per journey map (no gaps in sequence)
  CONSTRAINT unique_position_per_map UNIQUE (journey_map_id, position)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Indexes for user_journey_maps
CREATE INDEX idx_user_journey_maps_project_id ON user_journey_maps(project_id);
CREATE INDEX idx_user_journey_maps_project_created ON user_journey_maps(project_id, created_at DESC);
CREATE INDEX idx_user_journey_maps_persona_id ON user_journey_maps(persona_id);

-- Indexes for user_journey_map_timeline
CREATE INDEX idx_timeline_journey_map_id ON user_journey_map_timeline(journey_map_id);
CREATE INDEX idx_timeline_user_story_id ON user_journey_map_timeline(user_story_id);
CREATE INDEX idx_timeline_position ON user_journey_map_timeline(journey_map_id, position);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

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

-- Enable RLS on user_journey_map_timeline
ALTER TABLE user_journey_map_timeline ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_journey_map_timeline
CREATE POLICY "Users can view timeline entries from their journey maps"
  ON user_journey_map_timeline FOR SELECT
  USING (
    journey_map_id IN (
      SELECT id FROM user_journey_maps
      WHERE project_id IN (
        SELECT project_id FROM project_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create timeline entries in their journey maps"
  ON user_journey_map_timeline FOR INSERT
  WITH CHECK (
    journey_map_id IN (
      SELECT id FROM user_journey_maps
      WHERE project_id IN (
        SELECT project_id FROM project_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update timeline entries in their journey maps"
  ON user_journey_map_timeline FOR UPDATE
  USING (
    journey_map_id IN (
      SELECT id FROM user_journey_maps
      WHERE project_id IN (
        SELECT project_id FROM project_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete timeline entries from their journey maps"
  ON user_journey_map_timeline FOR DELETE
  USING (
    journey_map_id IN (
      SELECT id FROM user_journey_maps
      WHERE project_id IN (
        SELECT project_id FROM project_members WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger for user_journey_maps
CREATE TRIGGER update_user_journey_maps_updated_at
  BEFORE UPDATE ON user_journey_maps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VALIDATION FUNCTION
-- ============================================================================
-- Ensure at least one user story is in the timeline

CREATE OR REPLACE FUNCTION validate_journey_map_has_stories()
RETURNS TRIGGER AS $$
BEGIN
  -- When inserting/updating a journey map, check if it has at least one story in timeline
  IF (TG_OP = 'DELETE') THEN
    -- When deleting a timeline entry, check if it's the last one
    IF NOT EXISTS (
      SELECT 1 FROM user_journey_map_timeline
      WHERE journey_map_id = OLD.journey_map_id
      AND id != OLD.id
    ) THEN
      RAISE EXCEPTION 'Cannot delete the last user story from journey map timeline';
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to prevent deletion of last story
CREATE TRIGGER validate_journey_map_has_stories_trigger
  BEFORE DELETE ON user_journey_map_timeline
  FOR EACH ROW
  EXECUTE FUNCTION validate_journey_map_has_stories();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE user_journey_maps IS 'User journey maps showing the steps a user takes to accomplish a goal';
COMMENT ON COLUMN user_journey_maps.stages IS 'Array of journey stages with actions, thoughts, emotions, pain points, and touchpoints (JSONB)';
COMMENT ON COLUMN user_journey_maps.persona_id IS 'Required reference to the persona this journey map is based on';
COMMENT ON COLUMN user_journey_maps.ai_optimize_timeline IS 'Flag indicating if AI was allowed to optimize the timeline order';

COMMENT ON TABLE user_journey_map_timeline IS 'Timeline of user stories in a journey map, maintaining order and allowing duplicates';
COMMENT ON COLUMN user_journey_map_timeline.position IS 'Zero-based position of the user story in the timeline sequence';