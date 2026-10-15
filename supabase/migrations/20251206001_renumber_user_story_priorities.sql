-- Migration: Renumber user_stories.priority_order to sequential values (1, 2, 3...)
-- Date: 2025-12-06
-- Spec: .agent-os/specs/2025-12-06-user-story-priority-cleanup/spec.md

BEGIN;

-- Create a temporary function to renumber priorities for a single project
CREATE OR REPLACE FUNCTION renumber_project_priorities(p_project_id UUID)
RETURNS void AS $$
DECLARE
  story_record RECORD;
  new_order INTEGER := 1;
BEGIN
  -- Iterate through all stories in this project, ordered by current priority_order
  FOR story_record IN
    SELECT id
    FROM user_stories
    WHERE project_id = p_project_id
    ORDER BY priority_order ASC, created_at ASC
  LOOP
    -- Update each story with sequential priority_order
    UPDATE user_stories
    SET priority_order = new_order,
        updated_at = NOW()
    WHERE id = story_record.id;

    new_order := new_order + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute renumbering for all projects
DO $$
DECLARE
  project_record RECORD;
BEGIN
  FOR project_record IN
    SELECT DISTINCT project_id
    FROM user_stories
  LOOP
    PERFORM renumber_project_priorities(project_record.project_id);
  END LOOP;
END $$;

-- Drop the temporary function
DROP FUNCTION renumber_project_priorities(UUID);

-- Verify migration success
DO $$
DECLARE
  gap_count INTEGER;
  project_count INTEGER;
  total_stories INTEGER;
BEGIN
  -- Count total projects with user stories
  SELECT COUNT(DISTINCT project_id) INTO project_count
  FROM user_stories;

  -- Count total user stories
  SELECT COUNT(*) INTO total_stories
  FROM user_stories;

  -- Check for any gaps in priority_order sequences
  SELECT COUNT(*) INTO gap_count
  FROM (
    SELECT project_id,
           priority_order,
           LAG(priority_order) OVER (PARTITION BY project_id ORDER BY priority_order) as prev_order
    FROM user_stories
  ) gaps
  WHERE prev_order IS NOT NULL AND priority_order != prev_order + 1;

  IF gap_count > 0 THEN
    RAISE EXCEPTION 'Migration verification failed: Found % gaps in priority_order sequences', gap_count;
  END IF;

  RAISE NOTICE 'Migration verification successful:';
  RAISE NOTICE '  - Projects processed: %', project_count;
  RAISE NOTICE '  - Total stories renumbered: %', total_stories;
  RAISE NOTICE '  - All priority_order sequences are sequential (1, 2, 3...)';
END $$;

COMMIT;
