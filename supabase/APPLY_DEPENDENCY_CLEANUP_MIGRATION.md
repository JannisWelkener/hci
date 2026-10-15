# How to Apply User Story Dependency Cleanup Migration

This guide explains how to apply the database migration that adds automatic dependency cleanup when deleting user stories.

## Overview

**Migration File**: `20251207001_extend_cascade_deletion_with_dependency_cleanup.sql`
**Test File**: `20251207002_test_dependency_cleanup.sql`

### What This Migration Does

When you delete a user story, the system will now automatically:
1. **Remove all references** to the deleted story from other stories' `dependencies` arrays
2. **Delete cascade journey maps** that reference the story (existing functionality)
3. **Delete the story** itself
4. **Return statistics** about what was cleaned up

---

## Method 1: Using Supabase Dashboard (Recommended for Production)

### Step 1: Apply the Migration

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Create a new query
4. Copy the entire contents of:
   ```
   supabase/migrations/20251207001_extend_cascade_deletion_with_dependency_cleanup.sql
   ```
5. Paste it into the SQL editor
6. Click **Run** to execute the migration
7. Verify success (you should see "Success. No rows returned")

### Step 2: Run the Tests (Optional but Recommended)

1. In the same SQL Editor, create another new query
2. Copy the entire contents of:
   ```
   supabase/migrations/20251207002_test_dependency_cleanup.sql
   ```
3. Paste it into the SQL editor
4. Click **Run** to execute the tests
5. Check the **Messages** or **Logs** tab to see test results
6. You should see output like:
   ```
   NOTICE:  TEST CASE 1: ALL CHECKS PASSED ✓
   NOTICE:  TEST CASE 2: ALL CHECKS PASSED ✓
   NOTICE:  TEST CASE 3: ALL CHECKS PASSED ✓
   NOTICE:  TEST CASE 4: ALL CHECKS PASSED ✓
   NOTICE:  TEST CASE 5: ALL CHECKS PASSED ✓
   NOTICE:  ALL TEST CASES COMPLETED SUCCESSFULLY ✓
   ```
7. The test file uses `ROLLBACK` at the end, so no test data will be saved to your database

---

## Method 2: Using Supabase CLI (For Development)

### Prerequisites

Install Supabase CLI if you haven't already:
```bash
npm install -g supabase
```

### Apply Migration

1. Link your project to Supabase (if not already done):
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

2. Push the migration to your database:
   ```bash
   supabase db push
   ```

### Run Tests

To run the test file via CLI:
```bash
supabase db execute -f supabase/migrations/20251207002_test_dependency_cleanup.sql
```

Or run it directly through psql:
```bash
psql YOUR_DATABASE_URL -f supabase/migrations/20251207002_test_dependency_cleanup.sql
```

---

## Verification

After applying the migration, verify the function is updated:

### Check Function Exists

```sql
SELECT
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'delete_user_story_with_cascade'
  AND routine_schema = 'public';
```

### Test the Function Manually

Create a test scenario and verify dependency cleanup works:

```sql
BEGIN;

-- Create test stories
INSERT INTO user_stories (project_id, title, user_role, user_action, priority, status, dependencies)
SELECT
  id,
  'Test Story A',
  'User',
  'test action A',
  'high',
  'draft',
  '[]'::jsonb
FROM projects LIMIT 1
RETURNING id; -- Note this ID as story_a_id

-- Create story that depends on Story A (replace story_a_id)
INSERT INTO user_stories (project_id, title, user_role, user_action, priority, status, dependencies)
SELECT
  id,
  'Test Story B',
  'User',
  'test action B',
  'medium',
  'draft',
  jsonb_build_array(
    jsonb_build_object('story_id', 'REPLACE_WITH_STORY_A_ID', 'type', 'blocks')
  )
FROM projects LIMIT 1;

-- Delete Story A and check results
SELECT delete_user_story_with_cascade(
  'REPLACE_WITH_STORY_A_ID'::UUID,
  'REPLACE_WITH_PROJECT_ID'::UUID
);

-- Expected result:
-- {
--   "success": true,
--   "deleted": {
--     "story": true,
--     "journeyMaps": 0,
--     "timelineEntries": 0
--   },
--   "updated": {
--     "dependenciesUpdated": 1
--   }
-- }

-- Verify Story B's dependencies are cleaned up
SELECT dependencies FROM user_stories WHERE title = 'Test Story B';
-- Should NOT contain the deleted story ID

ROLLBACK;
```

---

## Expected Return Value Format

After this migration, the `delete_user_story_with_cascade()` function returns:

```json
{
  "success": true,
  "deleted": {
    "story": true,
    "journeyMaps": 2,
    "timelineEntries": 3
  },
  "updated": {
    "dependenciesUpdated": 4
  }
}
```

**New field**: `updated.dependenciesUpdated` - The count of stories whose dependency arrays were modified

---

## Rollback (if needed)

If you need to rollback to the previous version of the function:

```sql
-- Restore the original function without dependency cleanup
CREATE OR REPLACE FUNCTION delete_user_story_with_cascade(
  p_story_id UUID,
  p_project_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_journey_map_count INTEGER := 0;
  v_timeline_entry_count INTEGER := 0;
  v_journey_map_ids UUID[];
  v_story_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM user_stories
    WHERE id = p_story_id AND project_id = p_project_id
  ) INTO v_story_exists;

  IF NOT v_story_exists THEN
    RAISE EXCEPTION 'User story not found or does not belong to this project'
      USING ERRCODE = 'P0001';
  END IF;

  SELECT ARRAY_AGG(DISTINCT journey_map_id)
  INTO v_journey_map_ids
  FROM user_journey_map_timeline
  WHERE user_story_id = p_story_id;

  DELETE FROM user_journey_map_timeline
  WHERE user_story_id = p_story_id;

  GET DIAGNOSTICS v_timeline_entry_count = ROW_COUNT;

  IF v_journey_map_ids IS NOT NULL AND array_length(v_journey_map_ids, 1) > 0 THEN
    DELETE FROM user_journey_maps
    WHERE id = ANY(v_journey_map_ids)
      AND project_id = p_project_id;

    GET DIAGNOSTICS v_journey_map_count = ROW_COUNT;
  END IF;

  DELETE FROM user_stories
  WHERE id = p_story_id
    AND project_id = p_project_id;

  RETURN json_build_object(
    'success', true,
    'deleted', json_build_object(
      'story', true,
      'journeyMaps', v_journey_map_count,
      'timelineEntries', v_timeline_entry_count
    )
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in delete_user_story_with_cascade: %', SQLERRM;
    RAISE;
END;
$$;
```

---

## Troubleshooting

### Error: "operator does not exist: jsonb @> jsonb[]"

**Cause**: Incorrect JSONB query syntax
**Solution**: The migration uses `jsonb_build_array()` which is correct. Ensure you're on PostgreSQL 12+.

### Error: "function jsonb_agg does not exist"

**Cause**: Old PostgreSQL version
**Solution**: Upgrade to PostgreSQL 12+ or use `json_agg()::jsonb` instead.

### Test failures

**Cause**: Database state issues or missing test data
**Solution**: Ensure you have at least one project in your database before running tests.

### Performance issues with large datasets

**Issue**: Slow dependency cleanup for projects with thousands of stories
**Solution**: The migration includes a GIN index on the `dependencies` column (created in migration `20251112001_add_user_stories_enhancements.sql`). Ensure this index exists:

```sql
CREATE INDEX IF NOT EXISTS idx_user_stories_dependencies
ON user_stories USING GIN (dependencies);
```

---

## Related Files

- **Migration**: `supabase/migrations/20251207001_extend_cascade_deletion_with_dependency_cleanup.sql`
- **Tests**: `supabase/migrations/20251207002_test_dependency_cleanup.sql`
- **Original Function**: `supabase/migrations/20251122001_user_story_cascade_deletion.sql`
- **Spec**: `.agent-os/specs/2025-12-07-user-story-dependency-cleanup/spec.md`

---

## Next Steps

After applying this migration, proceed with:
1. **Task 2**: Update the DELETE API endpoint to return dependency cleanup statistics
2. **Task 3**: Create React hook to fetch incoming story dependencies
3. **Task 4**: Update deletion dialog UI to display dependency warnings

See `.agent-os/specs/2025-12-07-user-story-dependency-cleanup/tasks.md` for details.
