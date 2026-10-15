# How to Apply Simplify User Story Dependencies Migration

This guide explains how to apply the database migration that simplifies user story dependencies from object arrays to simple string arrays.

## Overview

**Migration File**: `20251208001_simplify_user_story_dependencies.sql`
**Rollback File**: `20251208002_rollback_simplify_dependencies.sql`

### What This Migration Does

This migration simplifies the user story dependency structure:

**Before:**
```json
[
  { "story_id": "uuid-1", "type": "blocks" },
  { "story_id": "uuid-2", "type": "requires" }
]
```

**After:**
```json
[
  "uuid-1",
  "uuid-2"
]
```

**Changes:**
1. **Transforms** all existing dependencies from `{story_id, type}` objects to simple UUID strings
2. **Removes** the `type` field (blocks/requires/relates_to) from all dependencies
3. **Adds** validation constraint to ensure dependencies contain only UUID strings
4. **Preserves** all dependency relationships (no data loss - only type metadata is removed)

---

## ⚠️ Important: Run This Migration BEFORE Deploying Code Changes

**Critical**: This migration must be run **BEFORE** deploying the updated application code that uses the new simplified dependency structure. Otherwise, the application will encounter type errors when reading existing dependencies.

**Recommended order:**
1. ✅ Apply this migration to the database
2. ✅ Verify migration success (see Verification section below)
3. ✅ Deploy updated application code

---

## Method 1: Using Supabase Dashboard (Recommended for Production)

### Step 1: Backup Your Data (Recommended)

Before running any migration, create a backup of your user_stories table:

```sql
-- Create backup table
CREATE TABLE user_stories_backup_20251208 AS
SELECT * FROM user_stories;

-- Verify backup
SELECT COUNT(*) FROM user_stories_backup_20251208;
```

### Step 2: Apply the Migration

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Create a new query
4. Copy the entire contents of:
   ```
   supabase/migrations/20251208001_simplify_user_story_dependencies.sql
   ```
5. Paste it into the SQL editor
6. Click **Run** to execute the migration
7. Verify success (you should see "Success. No rows returned")

### Step 3: Verify the Migration

Run this query to verify the transformation:

```sql
-- Check dependency structure after migration
SELECT
  id,
  title,
  dependencies,
  jsonb_typeof(dependencies) as type,
  jsonb_array_length(dependencies) as dep_count,
  (
    SELECT bool_and(jsonb_typeof(elem) = 'string')
    FROM jsonb_array_elements(dependencies) AS elem
  ) as all_strings
FROM user_stories
WHERE dependencies != '[]'::jsonb
LIMIT 10;
```

**Expected results:**
- `type` column should show `"array"`
- `all_strings` column should be `true` (or `NULL` for empty arrays)
- `dependencies` should contain simple UUID strings, not objects

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

### Verify Via CLI

```bash
supabase db execute "SELECT COUNT(*) as stories_with_deps FROM user_stories WHERE dependencies != '[]'::jsonb"
```

---

## Verification Queries

### Check All Dependencies Are Transformed

```sql
-- This should return 0 rows if migration succeeded
SELECT
  id,
  title,
  dependencies
FROM user_stories
WHERE dependencies != '[]'::jsonb
  AND EXISTS (
    SELECT 1
    FROM jsonb_array_elements(dependencies) AS elem
    WHERE jsonb_typeof(elem) != 'string'
  );
```

If this query returns any rows, the migration did not complete successfully.

### Count Stories with Dependencies

```sql
SELECT
  COUNT(*) FILTER (WHERE dependencies = '[]'::jsonb) as no_deps,
  COUNT(*) FILTER (WHERE dependencies != '[]'::jsonb) as has_deps,
  COUNT(*) as total
FROM user_stories;
```

### Sample Transformed Dependencies

```sql
SELECT
  title,
  dependencies,
  jsonb_array_length(dependencies) as count
FROM user_stories
WHERE dependencies != '[]'::jsonb
ORDER BY created_at DESC
LIMIT 5;
```

---

## Rollback (if needed)

If you need to rollback to the previous structure, run the rollback migration:

### Via Supabase Dashboard

1. Go to SQL Editor
2. Copy contents of `supabase/migrations/20251208002_rollback_simplify_dependencies.sql`
3. Paste and run

### Via Supabase CLI

```bash
supabase db execute -f supabase/migrations/20251208002_rollback_simplify_dependencies.sql
```

**Note**: The rollback will restore the object structure, but all dependencies will have `type: 'requires'` as a default value (original type information cannot be recovered after forward migration).

---

## Troubleshooting

### Error: "column dependencies does not exist"

**Cause**: This migration requires the user_stories table to have a `dependencies` column.
**Solution**: Ensure migration `20251112001_add_user_stories_enhancements.sql` has been applied.

### Error: "function jsonb_agg does not exist"

**Cause**: PostgreSQL version is too old.
**Solution**: Upgrade to PostgreSQL 12+ or contact Supabase support.

### Some dependencies still have object structure

**Cause**: Migration WHERE clause filters prevented transformation.
**Solution**: Check for NULL dependencies or non-array JSONB types:

```sql
SELECT id, title, dependencies, jsonb_typeof(dependencies)
FROM user_stories
WHERE dependencies IS NOT NULL
  AND jsonb_typeof(dependencies) != 'array';
```

### Performance issues during migration

**Issue**: Migration is slow for large datasets.
**Solution**: The migration uses `jsonb_array_elements()` which can be slow for very large arrays. For projects with 1000+ stories with many dependencies, consider running during low-traffic period.

---

## Testing Before Production

To test the migration on sample data without affecting production:

```sql
BEGIN; -- Start transaction

-- Create test story with old-format dependencies
INSERT INTO user_stories (project_id, title, user_role, action, benefit, dependencies)
SELECT
  id,
  'Test Story with Dependencies',
  'User',
  'test the migration',
  'verify transformation works',
  '[{"story_id": "123e4567-e89b-12d3-a456-426614174000", "type": "requires"}]'::jsonb
FROM projects LIMIT 1
RETURNING id, dependencies;
-- Note the ID and dependency structure

-- Run the migration UPDATE statement (just for this test story)
UPDATE user_stories
SET dependencies = (
  SELECT jsonb_agg(dep->>'story_id')
  FROM jsonb_array_elements(dependencies) AS dep
)
WHERE title = 'Test Story with Dependencies';

-- Check result
SELECT dependencies FROM user_stories WHERE title = 'Test Story with Dependencies';
-- Should show: ["123e4567-e89b-12d3-a456-426614174000"]

ROLLBACK; -- Rollback test changes
```

---

## After Migration

### Update Application Code

After successfully running this migration, deploy the updated application code that includes:

1. ✅ Updated TypeScript types (`lib/types/database.ts`)
2. ✅ Updated validation schemas (`lib/validations/user-story.ts`)
3. ✅ Updated API endpoints (removed `type` field handling)
4. ✅ Updated UI components (DependencySelector, DependencyList, DependencyBadge)
5. ✅ Updated form components

See `.agent-os/specs/2025-12-08-simplify-user-story-dependencies/tasks.md` for full implementation checklist.

### Cleanup Backup Table (Optional)

After confirming everything works in production:

```sql
DROP TABLE IF EXISTS user_stories_backup_20251208;
```

---

## Expected Impact

- **Data Size**: ~30-40% reduction in `dependencies` JSONB column size
- **Performance**: Slightly faster dependency queries (simpler structure)
- **Breaking Changes**: Yes - existing API clients expecting `type` field will need updates
- **User Impact**: Simplified dependency management UI (no type selection needed)

---

## Related Files

- **Forward Migration**: `supabase/migrations/20251208001_simplify_user_story_dependencies.sql`
- **Rollback Migration**: `supabase/migrations/20251208002_rollback_simplify_dependencies.sql`
- **Spec**: `.agent-os/specs/2025-12-08-simplify-user-story-dependencies/spec.md`
- **Tasks**: `.agent-os/specs/2025-12-08-simplify-user-story-dependencies/tasks.md`
- **Database Schema Spec**: `.agent-os/specs/2025-12-08-simplify-user-story-dependencies/sub-specs/database-schema.md`
