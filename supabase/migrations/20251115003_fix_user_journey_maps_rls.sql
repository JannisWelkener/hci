-- Migration: Fix user_journey_maps RLS policies to include project owners
-- Created: 2025-11-15
-- Description: Updates RLS policies to allow project owners (not just members) to access journey maps

-- ============================================================================
-- DROP OLD POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view journey maps from their projects" ON user_journey_maps;
DROP POLICY IF EXISTS "Users can create journey maps in their projects" ON user_journey_maps;
DROP POLICY IF EXISTS "Users can update journey maps in their projects" ON user_journey_maps;
DROP POLICY IF EXISTS "Users can delete journey maps in their projects" ON user_journey_maps;

DROP POLICY IF EXISTS "Users can view timeline entries from their journey maps" ON user_journey_map_timeline;
DROP POLICY IF EXISTS "Users can create timeline entries in their journey maps" ON user_journey_map_timeline;
DROP POLICY IF EXISTS "Users can update timeline entries in their journey maps" ON user_journey_map_timeline;
DROP POLICY IF EXISTS "Users can delete timeline entries from their journey maps" ON user_journey_map_timeline;

-- ============================================================================
-- CREATE NEW POLICIES FOR USER_JOURNEY_MAPS
-- ============================================================================

-- Policy: Users can view journey maps from projects they own or are members of
CREATE POLICY "Users can view journey maps from their projects"
  ON user_journey_maps FOR SELECT
  USING (
    project_id IN (
      -- User is project owner
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
    OR
    project_id IN (
      -- User is project member
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can create journey maps in projects they own or are members of
CREATE POLICY "Users can create journey maps in their projects"
  ON user_journey_maps FOR INSERT
  WITH CHECK (
    (
      project_id IN (
        -- User is project owner
        SELECT id FROM projects WHERE user_id = auth.uid()
      )
      OR
      project_id IN (
        -- User is project member
        SELECT project_id FROM project_members WHERE user_id = auth.uid()
      )
    )
    AND created_by = auth.uid()
  );

-- Policy: Users can update journey maps in projects they own or are members of
CREATE POLICY "Users can update journey maps in their projects"
  ON user_journey_maps FOR UPDATE
  USING (
    project_id IN (
      -- User is project owner
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
    OR
    project_id IN (
      -- User is project member
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can delete journey maps in projects they own or are members of
CREATE POLICY "Users can delete journey maps in their projects"
  ON user_journey_maps FOR DELETE
  USING (
    project_id IN (
      -- User is project owner
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
    OR
    project_id IN (
      -- User is project member
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- CREATE NEW POLICIES FOR USER_JOURNEY_MAP_TIMELINE
-- ============================================================================

-- Policy: Users can view timeline entries from journey maps in their projects
CREATE POLICY "Users can view timeline entries from their journey maps"
  ON user_journey_map_timeline FOR SELECT
  USING (
    journey_map_id IN (
      SELECT id FROM user_journey_maps
      WHERE project_id IN (
        -- User is project owner
        SELECT id FROM projects WHERE user_id = auth.uid()
      )
      OR project_id IN (
        -- User is project member
        SELECT project_id FROM project_members WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Users can create timeline entries in journey maps in their projects
CREATE POLICY "Users can create timeline entries in their journey maps"
  ON user_journey_map_timeline FOR INSERT
  WITH CHECK (
    journey_map_id IN (
      SELECT id FROM user_journey_maps
      WHERE project_id IN (
        -- User is project owner
        SELECT id FROM projects WHERE user_id = auth.uid()
      )
      OR project_id IN (
        -- User is project member
        SELECT project_id FROM project_members WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Users can update timeline entries in journey maps in their projects
CREATE POLICY "Users can update timeline entries in their journey maps"
  ON user_journey_map_timeline FOR UPDATE
  USING (
    journey_map_id IN (
      SELECT id FROM user_journey_maps
      WHERE project_id IN (
        -- User is project owner
        SELECT id FROM projects WHERE user_id = auth.uid()
      )
      OR project_id IN (
        -- User is project member
        SELECT project_id FROM project_members WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Users can delete timeline entries from journey maps in their projects
CREATE POLICY "Users can delete timeline entries from their journey maps"
  ON user_journey_map_timeline FOR DELETE
  USING (
    journey_map_id IN (
      SELECT id FROM user_journey_maps
      WHERE project_id IN (
        -- User is project owner
        SELECT id FROM projects WHERE user_id = auth.uid()
      )
      OR project_id IN (
        -- User is project member
        SELECT project_id FROM project_members WHERE user_id = auth.uid()
      )
    )
  );