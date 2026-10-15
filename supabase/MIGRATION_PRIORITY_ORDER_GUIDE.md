# User Story Priority Order Migration Guide

This guide documents the process for migrating user story priority_order values from 1000-increment gaps to sequential numbering (1, 2, 3...).

**Spec:** `.agent-os/specs/2025-12-06-user-story-priority-cleanup/spec.md`

**Migration Date:** 2025-12-06

---

## Overview

### What This Migration Does

- Converts all `user_stories.priority_order` values from 1000-increment gaps (1000, 2000, 3000...) to sequential numbering (1, 2, 3...)
- Maintains relative ordering within each project
- Ensures no gaps or duplicates in priority_order sequences
- Updates `updated_at` timestamp for affected records

### What Changes

**Before Migration:**
```
Project A User Stories:
  Story 1: priority_order = 1000
  Story 2: priority_order = 2000
  Story 3: priority_order = 3000
```

**After Migration:**
```
Project A User Stories:
  Story 1: priority_order = 1
  Story 2: priority_order = 2
  Story 3: priority_order = 3
```

---

## Migration Files

1. **Forward Migration:** `supabase/migrations/20251206001_renumber_user_story_priorities.sql`
   - Converts to sequential numbering

2. **Rollback Migration:** `supabase/migrations/20251206002_rollback_renumber_user_story_priorities.sql`
   - Restores 1000-increment gaps if needed

3. **Validation Queries:** `supabase/migrations/validate_priority_order.sql`
   - Verifies migration success

---

## Pre-Migration Checklist

- [ ] Backup current database (recommended)
- [ ] Verify all user stories have valid priority_order values (no NULLs)
- [ ] Note current total count of user stories for verification
- [ ] Review migration script for understanding
- [ ] Ensure no active users are reordering stories during migration

---

## Method 1: Using Supabase Dashboard (Recommended)

### Step 1: Access SQL Editor

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Create a new query

### Step 2: Run Pre-Migration Validation (Optional)

Before running the migration, verify current state:

```sql
-- Check total user stories
SELECT COUNT(*) as total_stories FROM user_stories;

-- Check total projects with user stories
SELECT COUNT(DISTINCT project_id) as total_projects FROM user_stories;

-- Sample current priority_order values
SELECT project_id, id, priority_order
FROM user_stories
ORDER BY project_id, priority_order
LIMIT 20;
```

### Step 3: Execute Migration

1. Copy the entire contents of: `supabase/migrations/20251206001_renumber_user_story_priorities.sql`
2. Paste it into the SQL editor
3. Click **Run** to execute the migration
4. Watch for success messages in the output:
   ```
   NOTICE: Migration verification successful:
   NOTICE:   - Projects processed: X
   NOTICE:   - Total stories renumbered: Y
   NOTICE:   - All priority_order sequences are sequential (1, 2, 3...)
   ```

### Step 4: Verify Migration Success

Run the validation queries from `supabase/migrations/validate_priority_order.sql`:

**Quick Verification:**
```sql
-- Should return 0 rows (no gaps)
SELECT project_id, priority_order,
       priority_order - LAG(priority_order) OVER (PARTITION BY project_id ORDER BY priority_order) as gap_size
FROM user_stories
WHERE LAG(priority_order) OVER (PARTITION BY project_id ORDER BY priority_order) IS NOT NULL
  AND priority_order != LAG(priority_order) OVER (PARTITION BY project_id ORDER BY priority_order) + 1;

-- Should return 0 rows (no duplicates)
SELECT project_id, priority_order, COUNT(*) as duplicate_count
FROM user_stories
GROUP BY project_id, priority_order
HAVING COUNT(*) > 1;

-- Summary (all projects should be VALID)
SELECT project_id,
       COUNT(*) as story_count,
       MIN(priority_order) as min_order,
       MAX(priority_order) as max_order,
       CASE
         WHEN MIN(priority_order) = 1 AND MAX(priority_order) = COUNT(*) THEN 'VALID'
         ELSE 'INVALID'
       END as validation_status
FROM user_stories
GROUP BY project_id;
```

### Step 5: Test in Application

1. Navigate to the user stories page in your application
2. Verify stories are displayed in correct order
3. Test drag-and-drop reordering (should work with new sequential values)
4. Check that new stories are assigned sequential priority_order values

---

## Method 2: Using Supabase CLI

### Prerequisites

Install Supabase CLI if you haven't already:
```bash
npm install -g supabase
```

### Steps

1. Link your project (if not already linked):
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

2. Run the migration:
   ```bash
   supabase db push
   ```

3. Verify migration success:
   ```bash
   supabase db query < supabase/migrations/validate_priority_order.sql
   ```

---

## Rollback Instructions

If you need to rollback the migration (restore 1000-increment gaps):

### Using Supabase Dashboard

1. Open SQL Editor
2. Copy contents of: `supabase/migrations/20251206002_rollback_renumber_user_story_priorities.sql`
3. Paste and click **Run**
4. Verify rollback success message:
   ```
   NOTICE: Rollback verification successful:
   NOTICE:   - Projects processed: X
   NOTICE:   - Total stories restored: Y
   NOTICE:   - All priority_order values restored to 1000-increment gaps
   ```

### Using Supabase CLI

```bash
supabase db query < supabase/migrations/20251206002_rollback_renumber_user_story_priorities.sql
```

---

## Post-Migration Checklist

- [ ] All validation queries return 0 rows for errors
- [ ] Summary query shows all projects as VALID
- [ ] User stories display correctly in application
- [ ] Drag-and-drop reordering works correctly
- [ ] New user stories are assigned sequential priority_order
- [ ] No errors in application logs related to priority_order

---

## Expected Results

### Validation Query Results

**Query 1 (Gaps):** 0 rows
**Query 2 (Duplicates):** 0 rows
**Query 3 (Sequential Check):** 0 rows
**Query 4 (Starting at 1):** 0 rows
**Query 5 (Summary):** All projects show "VALID"
**Query 6 (Overall Status):** incorrectly_ordered = 0

### Application Behavior

- User stories table displays stories in order 1, 2, 3...
- Drag-and-drop updates priority_order with sequential values
- New stories are appended with next sequential number
- No errors in console or network requests

---

## Troubleshooting

### Issue: Migration fails with "gap_count > 0"

**Cause:** Some stories were not ordered sequentially after migration

**Solution:**
1. Run migration again (it's idempotent)
2. Check for concurrent updates during migration
3. Verify no stories were deleted mid-migration

### Issue: Some projects show "INVALID" in validation

**Cause:** Project has gaps or doesn't start at 1

**Solution:**
1. Identify the problematic project_id from validation query
2. Manually inspect stories for that project
3. Re-run migration function for specific project:
   ```sql
   SELECT renumber_project_priorities('project-uuid-here');
   ```

### Issue: Application shows errors after migration

**Cause:** Frontend/API still expecting 1000-increment values

**Solution:**
1. Ensure Task 2 (API updates) and Task 3 (Frontend updates) are completed
2. Clear browser cache
3. Restart development server
4. Check API endpoints are using new sequential calculation

---

## Migration Performance

**Expected Execution Time:**
- Small datasets (< 100 stories): < 1 second
- Medium datasets (100-1000 stories): 1-5 seconds
- Large datasets (> 1000 stories): 5-30 seconds

**Database Impact:**
- Updates `priority_order` column for all user stories
- Updates `updated_at` timestamp for all user stories
- Minimal lock time (per-row updates within transaction)

---

## Contact

If you encounter issues during migration:
1. Check troubleshooting section above
2. Review validation queries for specific errors
3. Document error messages and context
4. Consider rollback if critical issues arise
