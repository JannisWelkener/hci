# How to Clean Up Orphaned Dependencies

This guide explains how to remove invalid dependency references from user stories.

## Problem

Some user stories have dependencies pointing to stories that no longer exist (orphaned dependencies). This causes errors when trying to edit those stories:

```
Error: One or more dependency stories not found. Missing IDs: 04a6ab3a-0b0d-40bc-8c8b-a25f27190eff
```

## Solution

Run the cleanup migration to automatically remove references to deleted stories.

---

## Quick Fix (Recommended)

### Using Supabase Dashboard

1. Go to your Supabase project: https://supabase.com/dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Create a new query
4. Copy and paste the following SQL:

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

5. Click **Run** to execute
6. You should see a success message

### Verify the Fix

Run this query to check if there are any remaining orphaned dependencies:

```sql
SELECT
  us.id,
  us.title,
  us.dependencies,
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

**Expected result**: 0 rows (no orphaned dependencies found)

---

## Alternative: Using the Migration File

If you prefer to use the migration system:

1. The migration file is located at:
   ```
   supabase/migrations/20251215001_cleanup_orphaned_dependencies.sql
   ```

2. Apply it using Supabase CLI:
   ```bash
   supabase db push
   ```

---

## What This Does

- **Scans** all user stories with dependencies
- **Checks** each dependency ID to see if that story still exists
- **Removes** any IDs that point to deleted stories
- **Preserves** all valid dependencies

## Example

**Before:**
```json
{
  "dependencies": [
    "04a6ab3a-0b0d-40bc-8c8b-a25f27190eff",  // ❌ Deleted story
    "be70c356-55ba-4251-8cab-c4d902a3f624",  // ✅ Exists
    "97aca523-ebd9-4abb-a690-fee3c2466d7f"   // ✅ Exists
  ]
}
```

**After:**
```json
{
  "dependencies": [
    "be70c356-55ba-4251-8cab-c4d902a3f624",  // ✅ Exists
    "97aca523-ebd9-4abb-a690-fee3c2466d7f"   // ✅ Exists
  ]
}
```

---

## After Running the Cleanup

1. Try editing your user story again
2. The error should be gone
3. Only valid dependencies will remain

---

## Prevention

To prevent this issue in the future, the delete operation should automatically remove the deleted story from all other stories' dependencies arrays. This can be implemented with a database trigger or application-level cleanup.
