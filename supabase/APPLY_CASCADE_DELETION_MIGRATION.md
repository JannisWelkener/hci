# Apply Cascade Deletion Migration Guide

This guide walks you through applying the user story cascade deletion migration to your Supabase database.

## Overview

The migration adds:
- **Performance indexes** on `user_journey_map_timeline` and `user_journey_maps` tables
- **Cascade deletion function** `delete_user_story_with_cascade()` for atomic deletions with statistics
- **Proper permissions** for authenticated users to execute the function

## Prerequisites

- Access to Supabase Dashboard (https://supabase.com/dashboard)
- Project owner or admin permissions
- Backup of your database (recommended for production)

## Step 1: Backup Your Database (Recommended)

Before applying any migration, create a backup:

1. Go to Supabase Dashboard → Your Project → Database → Backups
2. Click "Create Backup" or verify automatic backups are enabled

## Step 2: Apply the Migration

### Option A: Using Supabase CLI (Recommended)

```bash
# Ensure you're in the project directory
cd hci-hub

# Link to your Supabase project (if not already linked)
npx supabase link --project-ref your-project-ref

# Apply the migration
npx supabase db push
```

This will apply all pending migrations including `20251122001_user_story_cascade_deletion.sql`.

### Option B: Manual Application via SQL Editor

1. Go to Supabase Dashboard → Your Project → SQL Editor
2. Click "New Query"
3. Copy the contents of `migrations/20251122001_user_story_cascade_deletion.sql`
4. Paste into the SQL Editor
5. Click "Run" to execute

## Step 3: Verify the Migration

After applying the migration, verify it was successful:

### Check Indexes

```sql
-- Check that indexes were created
SELECT
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE tablename IN ('user_journey_map_timeline', 'user_journey_maps')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
```

Expected results:
- `idx_ujmt_user_story_id` on `user_journey_map_timeline`
- `idx_ujmt_journey_map_id` on `user_journey_map_timeline`
- `idx_ujm_project_id` on `user_journey_maps`

### Check Function

```sql
-- Check that the function was created
SELECT
  proname as function_name,
  pg_get_function_identity_arguments(oid) as arguments,
  prosecdef as security_definer
FROM pg_proc
WHERE proname = 'delete_user_story_with_cascade';
```

Expected result:
- Function name: `delete_user_story_with_cascade`
- Arguments: `p_story_id uuid, p_project_id uuid`
- Security definer: `true`

### Check Permissions

```sql
-- Check function permissions
SELECT
  grantee,
  privilege_type
FROM information_schema.routine_privileges
WHERE routine_name = 'delete_user_story_with_cascade';
```

Expected result:
- Grantee: `authenticated`
- Privilege type: `EXECUTE`

## Step 4: Test the Function (Optional but Recommended)

**IMPORTANT:** Only test with non-critical data or in a development environment!

### Test Query 1: Find a User Story with Dependencies

```sql
-- Find a user story that's referenced in journey maps
SELECT
  us.id as story_id,
  us.project_id,
  us.title as story_title,
  COUNT(DISTINCT ujmt.journey_map_id) as journey_map_count
FROM user_stories us
INNER JOIN user_journey_map_timeline ujmt ON us.id = ujmt.user_story_id
GROUP BY us.id, us.project_id, us.title
HAVING COUNT(DISTINCT ujmt.journey_map_id) > 0
LIMIT 1;
```

### Test Query 2: Test Cascade Deletion in Transaction

```sql
-- Wrap in transaction for safe testing
BEGIN;

-- Test the function (replace UUIDs with actual values from Test Query 1)
SELECT delete_user_story_with_cascade(
  'your-story-uuid-here'::UUID,
  'your-project-uuid-here'::UUID
);

-- Verify results
-- Expected output:
-- {
--   "success": true,
--   "deleted": {
--     "story": true,
--     "journeyMaps": X,
--     "timelineEntries": Y
--   }
-- }

-- ROLLBACK to undo the test deletion
ROLLBACK;

-- If testing in production, use COMMIT instead of ROLLBACK
-- But only after confirming the results are correct!
```

### Test Query 3: Test with No Dependencies

```sql
-- Find a user story with NO journey map references
SELECT
  us.id as story_id,
  us.project_id,
  us.title as story_title
FROM user_stories us
LEFT JOIN user_journey_map_timeline ujmt ON us.id = ujmt.user_story_id
WHERE ujmt.id IS NULL
LIMIT 1;

-- Test deletion (in transaction)
BEGIN;

SELECT delete_user_story_with_cascade(
  'story-id-with-no-deps'::UUID,
  'project-id'::UUID
);

-- Expected:
-- {
--   "success": true,
--   "deleted": {
--     "story": true,
--     "journeyMaps": 0,
--     "timelineEntries": 0
--   }
-- }

ROLLBACK;
```

## Step 5: Mark Migration as Complete

Update the tasks file:

```bash
# Edit .agent-os/specs/2025-11-22-user-story-cascade-deletion/tasks.md
# Check off subtask 1.6: ✅ Apply migration to Supabase and verify schema changes
```

## Troubleshooting

### Error: "relation already exists"

If indexes already exist, the migration will skip creating them (uses `IF NOT EXISTS`). This is safe.

### Error: "function already exists"

The migration uses `CREATE OR REPLACE FUNCTION`, so it will update the existing function. This is safe.

### Error: "permission denied"

Ensure you're using an account with sufficient database privileges (project owner or service role key).

### Testing the Function Returns an Error

1. Check that you're using valid UUIDs for both story_id and project_id
2. Verify the user story belongs to the specified project
3. Check Supabase logs for detailed error messages

## Rollback Instructions

If you need to rollback the migration:

```bash
# Using Supabase CLI
npx supabase db reset

# Or manually via SQL Editor:
# Run the contents of migrations/20251122002_rollback_user_story_cascade_deletion.sql
```

**WARNING:** Rollback will remove the cascade deletion function and indexes. Only do this if absolutely necessary.

## Next Steps

After successfully applying and verifying the migration:

1. ✅ Mark Task 1 as complete in tasks.md
2. 🚀 Proceed to Task 2: Backend API - Journey Map Dependency Endpoint
3. 📝 Update your team about the new cascade deletion capability

## Support

For issues or questions:
- Check Supabase Dashboard → Logs for detailed error messages
- Review the migration file: `migrations/20251122001_user_story_cascade_deletion.sql`
- Consult the spec: `.agent-os/specs/2025-11-22-user-story-cascade-deletion/spec.md`
