# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-12-06-user-story-priority-cleanup/spec.md

## Overview

The `priority_order` column in the `user_stories` table currently uses 1000-increment gaps (1000, 2000, 3000...) to allow for easy insertion of stories between existing ones. This migration will convert all existing values to clean sequential numbering (1, 2, 3...) while maintaining the relative order within each project.

## Schema Changes

### Existing Column (No Modification Needed)

```sql
-- The priority_order column already exists with the correct type
user_stories.priority_order INTEGER NOT NULL DEFAULT 0
```

**No column alterations are required.** The column type and constraints remain the same. Only the values need to be updated.

## Data Migration

### Migration Script

This migration renumbers all `priority_order` values to sequential format (1, 2, 3...) while preserving the order within each project.

```sql
-- Migration: Renumber user_stories.priority_order to sequential values
-- File: supabase/migrations/YYYYMMDDHHMMSS_renumber_user_story_priorities.sql

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
BEGIN
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

  RAISE NOTICE 'Migration verification successful: All priority_order sequences are sequential';
END $$;

COMMIT;
```

### Rollback Script

If the migration needs to be reverted, this script will restore the original 1000-increment gap system:

```sql
-- Rollback: Restore 1000-increment gaps for user_stories.priority_order
-- File: supabase/migrations/YYYYMMDDHHMMSS_renumber_user_story_priorities_rollback.sql

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

COMMIT;
```

## Migration Strategy

### Zero-Downtime Approach

1. **Pre-migration Validation**
   - Verify all user_stories have valid priority_order values (no NULLs)
   - Count total stories to estimate migration time
   - Backup current priority_order values to a temporary table

2. **Migration Execution**
   - Run migration during low-traffic period if possible
   - Use transaction to ensure atomicity
   - Process projects in batches if needed for large datasets
   - Monitor query execution time

3. **Post-migration Verification**
   - Verify all priority_order sequences start at 1 and increment by 1
   - Check for any gaps or duplicates within projects
   - Ensure total story count matches pre-migration count
   - Test drag-and-drop reordering functionality

4. **Rollback Plan**
   - Keep rollback script ready in case of issues
   - Document steps to execute rollback if needed
   - Monitor application logs for any priority_order related errors

## Data Integrity Checks

### Validation Queries

**Check for gaps in sequences:**
```sql
SELECT project_id,
       COUNT(*) as story_count,
       MIN(priority_order) as min_order,
       MAX(priority_order) as max_order,
       MAX(priority_order) - COUNT(*) + 1 as expected_min
FROM user_stories
GROUP BY project_id
HAVING MIN(priority_order) != 1 OR MAX(priority_order) != COUNT(*);
```

**Check for duplicate priority_order within projects:**
```sql
SELECT project_id, priority_order, COUNT(*) as duplicate_count
FROM user_stories
GROUP BY project_id, priority_order
HAVING COUNT(*) > 1;
```

**Verify sequential ordering:**
```sql
SELECT *
FROM (
  SELECT project_id,
         id,
         priority_order,
         ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY priority_order) as expected_order
  FROM user_stories
) check_sequential
WHERE priority_order != expected_order;
```

## Performance Considerations

### Index Optimization

The existing composite index on `(project_id, priority_order)` will remain effective with sequential values:

```sql
-- Existing index (no changes needed)
CREATE INDEX IF NOT EXISTS idx_user_stories_project_priority
ON user_stories(project_id, priority_order);
```

### Query Performance

- **Fetch ordered stories:** Sequential values do not impact query performance; index still optimizes ORDER BY
- **Find max priority:** Slightly faster with sequential values (smaller integers)
- **Bulk updates:** No significant difference in update performance

## Rationale

### Why Sequential Numbering?

1. **Simplicity:** Clean sequential numbers (1, 2, 3...) are easier to understand and reference in team discussions
2. **User Experience:** Users expect to see simple ordering without large gaps
3. **Maintainability:** Simpler logic in drag-and-drop reordering code
4. **No Functional Loss:** Insertion between items still works by renumbering all affected stories

### Why Not Keep 1000-Increment Gaps?

1. **Unnecessary Complexity:** Gaps were designed to minimize database updates, but modern databases handle small updates efficiently
2. **User Confusion:** Large numbers (1000, 2000, 3000) look odd in the UI and don't provide clear benefit
3. **Optimistic Updates:** Frontend already handles optimistic updates, so database write frequency is not a UX concern

### Trade-offs

**Advantages:**
- Cleaner, more intuitive numbering system
- Easier to understand and debug
- Simpler calculation logic in code

**Disadvantages:**
- More database writes on drag-and-drop (every affected story is updated vs. just the moved story)
- No longer have "space" between stories for quick insertions (requires renumbering)

**Decision:** The advantages outweigh the disadvantages for this application, as user story lists are typically small (< 100 stories per project) and drag-and-drop operations are infrequent.
