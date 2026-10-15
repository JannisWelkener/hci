# Fix User Story Dependency Issues - Complete Guide

This guide will fix the "One or more dependency stories not found" error.

## Problem Summary

You're seeing this error because:
1. **Orphaned Dependencies**: Story ID `04a6ab3a-0b0d-40bc-8c8b-a25f27190eff` was deleted but still referenced in dependencies
2. **Outdated Delete Function**: The cascade deletion function wasn't updated for the simplified dependency format

## Solution: Apply 3 Migrations in Order

Apply these migrations in your Supabase dashboard **in this exact order**:

---

## Step 1: Simplify Dependencies (if not already done)

**File**: `supabase/migrations/20251208001_simplify_user_story_dependencies.sql`

**What it does**: Converts dependencies from objects to simple string arrays

**Check if needed**: Run this query first:
```sql
SELECT dependencies FROM user_stories WHERE dependencies != '[]'::jsonb LIMIT 1;
```

- If you see: `[{"story_id": "...", "type": "..."}]` → **Apply this migration**
- If you see: `["uuid-1", "uuid-2"]` → **Skip to Step 2**

**How to apply**: See `supabase/APPLY_SIMPLIFY_DEPENDENCIES_MIGRATION.md`

---

## Step 2: Clean Up Orphaned Dependencies ⭐ **START HERE**

**File**: `supabase/migrations/20251215001_cleanup_orphaned_dependencies.sql`

**What it does**: Removes references to deleted stories

### Quick Apply (Copy and Run in SQL Editor)

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Create new query
3. Copy and paste:

```sql
-- Remove dependency references to stories that don't exist
UPDATE user_stories
SET dependencies = (
  SELECT COALESCE(
    jsonb_agg(dep_id),
    '[]'::jsonb
  )
  FROM jsonb_array_elements_text(dependencies) AS dep_id
  WHERE EXISTS (
    SELECT 1 FROM user_stories AS us WHERE us.id = dep_id::uuid
  )
)
WHERE dependencies IS NOT NULL
  AND dependencies != '[]'::jsonb
  AND jsonb_typeof(dependencies) = 'array';
```

4. Click **Run**
5. ✅ You should see "Success. No rows returned"

**This will fix your immediate issue** and remove the orphaned ID `04a6ab3a-0b0d-40bc-8c8b-a25f27190eff`.

---

## Step 3: Fix Delete Cascade Function

**File**: `supabase/migrations/20251215002_fix_cascade_deletion_for_simplified_dependencies.sql`

**What it does**: Updates the delete function to prevent orphaned dependencies in the future

### Quick Apply

1. In **SQL Editor**, create a new query
2. Copy the entire contents of:
   ```
   supabase/migrations/20251215002_fix_cascade_deletion_for_simplified_dependencies.sql
   ```
3. Paste and click **Run**
4. ✅ You should see "Success. No rows returned"

**This prevents the problem from happening again** when you delete stories.

---

## Verify Everything Works

After applying all migrations, run these verification queries:

### 1. Check for Orphaned Dependencies (should return 0 rows)
```sql
SELECT
  us.id,
  us.title,
  (
    SELECT jsonb_agg(dep_id)
    FROM jsonb_array_elements_text(us.dependencies) AS dep_id
    WHERE NOT EXISTS (
      SELECT 1 FROM user_stories AS us2 WHERE us2.id = dep_id::uuid
    )
  ) as orphaned_deps
FROM user_stories us
WHERE dependencies != '[]'::jsonb
  AND EXISTS (
    SELECT 1
    FROM jsonb_array_elements_text(us.dependencies) AS dep_id
    WHERE NOT EXISTS (
      SELECT 1 FROM user_stories AS us2 WHERE us2.id = dep_id::uuid
    )
  );
```

### 2. Test Dependency Format (should show string arrays)
```sql
SELECT
  title,
  dependencies,
  jsonb_typeof(dependencies) as type
FROM user_stories
WHERE dependencies != '[]'::jsonb
LIMIT 3;
```

Expected result:
```json
{
  "title": "Some Story",
  "dependencies": ["uuid-1", "uuid-2"],
  "type": "array"
}
```

---

## Test the Fix

1. Go to your user stories detail page
2. Click **Edit**
3. Click **Save Changes**
4. ✅ It should save without errors!

---

## Summary of Code Changes Already Made

These have been applied to your codebase:

✅ **Fixed Forms**
- `UserStoryForm.tsx` - Removed incorrect type cast
- `UserStoryFormEnhanced.tsx` - Removed incorrect type cast

✅ **Fixed Update Logic**
- `app/projects/[projectId]/user-stories/[storyId]/page.tsx` - Only send defined fields
- `app/projects/[projectId]/user-stories/page.tsx` - Proper typing

✅ **Better Error Messages**
- `app/api/projects/[id]/user-stories/[storyId]/route.ts` - Shows missing IDs

---

## Prevention

After applying these migrations, the system will:
- ✅ Automatically remove deleted story IDs from other stories' dependencies
- ✅ Prevent orphaned dependencies from accumulating
- ✅ Show clear error messages if any issues occur

---

## If You Still Have Issues

Check your console/logs for the error message. It will now show:
```
One or more dependency stories not found. Missing IDs: <uuid-list>
```

If you see this after applying migrations, there may be a caching issue. Try:
1. Hard refresh your browser (Ctrl+Shift+R / Cmd+Shift+R)
2. Clear application data in DevTools
3. Restart your dev server: `npm run dev`
