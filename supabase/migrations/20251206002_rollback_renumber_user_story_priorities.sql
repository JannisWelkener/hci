-- Rollback: Restore 1000-increment gaps for user_stories.priority_order
-- Date: 2025-12-06
-- Spec: .agent-os/specs/2025-12-06-user-story-priority-cleanup/spec.md

BEGIN;

-- Create a temporary function to restore 1000-increment gaps for a single project
CREATE OR REPLACE FUNCTION restore_project_priority_gaps(p_project_id UUID)
RETURNS void AS $$
DECLARE
  story_record RECORD;
  new_order INTEGER := 1000;
BEGIN
  -- Iterate through all stories in this project, ordered by current priority_order
  FOR story_record IN
    SELECT id
    FROM user_stories
    WHERE project_id = p_project_id
    ORDER BY priority_order ASC, created_at ASC
  LOOP
    -- Update each story with 1000-increment priority_order
    UPDATE user_stories
    SET priority_order = new_order,
        updated_at = NOW()
    WHERE id = story_record.id;

    new_order := new_order + 1000;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute rollback for all projects
DO $$
DECLARE
  project_record RECORD;
BEGIN
  FOR project_record IN
    SELECT DISTINCT project_id
    FROM user_stories
  LOOP
    PERFORM restore_project_priority_gaps(project_record.project_id);
  END LOOP;
END $$;

-- Drop the temporary function
DROP FUNCTION restore_project_priority_gaps(UUID);

-- Verify rollback success
DO $$
DECLARE
  project_count INTEGER;
  total_stories INTEGER;
  incorrect_gaps INTEGER;
BEGIN
  -- Count total projects with user stories
  SELECT COUNT(DISTINCT project_id) INTO project_count
  FROM user_stories;

  -- Count total user stories
  SELECT COUNT(*) INTO total_stories
  FROM user_stories;

  -- Check for any priority_order values not following 1000-increment pattern
  SELECT COUNT(*) INTO incorrect_gaps
  FROM (
    SELECT project_id,
           priority_order,
           LAG(priority_order) OVER (PARTITION BY project_id ORDER BY priority_order) as prev_order
    FROM user_stories
  ) gaps
  WHERE prev_order IS NOT NULL AND priority_order != prev_order + 1000;

  IF incorrect_gaps > 0 THEN
    RAISE EXCEPTION 'Rollback verification failed: Found % values not following 1000-increment pattern', incorrect_gaps;
  END IF;

  RAISE NOTICE 'Rollback verification successful:';
  RAISE NOTICE '  - Projects processed: %', project_count;
  RAISE NOTICE '  - Total stories restored: %', total_stories;
  RAISE NOTICE '  - All priority_order values restored to 1000-increment gaps';
END $$;

COMMIT;
