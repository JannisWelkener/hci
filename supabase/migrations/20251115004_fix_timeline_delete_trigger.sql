-- Migration: Remove timeline delete trigger that blocks journey map deletion
-- Created: 2025-11-15
-- Description: Removes the trigger that prevents deletion of the last timeline entry
--              The constraint that a journey map must have at least one stage is already
--              enforced by the stages_not_empty constraint on the user_journey_maps table.

-- ============================================================================
-- DROP TRIGGER AND FUNCTION
-- ============================================================================

DROP TRIGGER IF EXISTS validate_journey_map_has_stories_trigger ON user_journey_map_timeline;
DROP FUNCTION IF EXISTS validate_journey_map_has_stories();

-- Note: The constraint that ensures a journey map has at least one stage is already
-- enforced by the CHECK constraint on user_journey_maps.stages:
-- CONSTRAINT stages_not_empty CHECK (jsonb_array_length(stages) > 0)
--
-- The timeline can have entries added/removed freely, as long as the journey map
-- itself maintains valid stages data.
