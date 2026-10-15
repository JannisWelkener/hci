# Migration Guide: User Stories Enhancements (20251112)

This guide provides instructions for running and verifying the user stories enhancement migration.

## Migration Files

- **Forward Migration**: `supabase/migrations/20251112001_add_user_stories_enhancements.sql`
- **Rollback Migration**: `supabase/migrations/20251112002_rollback_user_stories_enhancements.sql`

## What This Migration Does

Adds four new columns to the `user_stories` table:
1. **description** (TEXT) - Stores story context and AI generation input
2. **priority_order** (INTEGER) - Explicit drag-and-drop ordering
3. **generation_method** (TEXT) - Tracks creation method (manual/ai_generated)
4. **dependencies** (JSONB) - Stores story relationships

Also creates 4 new indexes for query performance.

## Running the Migration

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Create a new query
4. Copy the entire contents of `supabase/migrations/20251112001_add_user_stories_enhancements.sql`
5. Paste it into the SQL editor
6. Click **Run** to execute the migration
7. Verify success (see verification steps below)

### Option 2: Supabase CLI

```bash
# If not already linked, link your project
supabase link --project-ref YOUR_PROJECT_REF

# Push the migration
supabase db push
```

## Verification Steps

After running the migration, execute these SQL queries to verify everything worked:

### 1. Check New Columns Exist

```sql
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'user_stories'
  AND column_name IN ('description', 'priority_order', 'generation_method', 'dependencies')
ORDER BY column_name;
```

**Expected Result**: 4 rows showing the new columns

### 2. Check Indexes Were Created

```sql
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'user_stories'
  AND indexname LIKE '%priority_order%'
  OR indexname LIKE '%dependencies%'
  OR indexname LIKE '%generation_method%';
```

**Expected Result**: 4 rows showing:
- `idx_user_stories_priority_order`
- `idx_user_stories_project_priority_order`
- `idx_user_stories_dependencies`
- `idx_user_stories_generation_method`

### 3. Verify priority_order Was Backfilled

```sql
SELECT
  id,
  title,
  priority,
  priority_order,
  created_at
FROM user_stories
ORDER BY priority_order ASC
LIMIT 10;
```

**Expected Result**: All rows should have non-zero `priority_order` values, sorted by priority level

### 4. Check Constraints

```sql
SELECT
  conname AS constraint_name,
  contype AS constraint_type
FROM pg_constraint
WHERE conrelid = 'user_stories'::regclass
  AND conname LIKE '%dependencies%' OR conname LIKE '%generation_method%';
```

**Expected Result**: Shows the `valid_dependencies_structure` constraint and generation_method CHECK constraint

### 5. Test New Columns Work

```sql
-- Test description column
UPDATE user_stories
SET description = 'Test description for migration verification'
WHERE id = (SELECT id FROM user_stories LIMIT 1)
RETURNING id, description;

-- Test priority_order update
UPDATE user_stories
SET priority_order = 999
WHERE id = (SELECT id FROM user_stories LIMIT 1)
RETURNING id, priority_order;

-- Test generation_method (should accept valid values)
UPDATE user_stories
SET generation_method = 'ai_generated'
WHERE id = (SELECT id FROM user_stories LIMIT 1)
RETURNING id, generation_method;

-- Test dependencies JSONB
UPDATE user_stories
SET dependencies = '[{"story_id": "123e4567-e89b-12d3-a456-426614174000", "type": "requires"}]'::jsonb
WHERE id = (SELECT id FROM user_stories LIMIT 1)
RETURNING id, dependencies;
```

**Expected Result**: All updates should succeed without errors

### 6. Test Constraints (Expect Failures)

```sql
-- This should FAIL (invalid generation_method)
UPDATE user_stories
SET generation_method = 'invalid_value'
WHERE id = (SELECT id FROM user_stories LIMIT 1);
-- Expected Error: new row violates check constraint

-- This should FAIL (dependencies must be array)
UPDATE user_stories
SET dependencies = '{"not": "an array"}'::jsonb
WHERE id = (SELECT id FROM user_stories LIMIT 1);
-- Expected Error: check constraint "valid_dependencies_structure" is violated
```

### 7. Verify Index Usage (Performance Check)

```sql
EXPLAIN ANALYZE
SELECT * FROM user_stories
WHERE project_id = (SELECT id FROM projects LIMIT 1)
ORDER BY priority_order ASC
LIMIT 50;
```

**Expected Result**: Query plan should show `Index Scan using idx_user_stories_project_priority_order`

## Rollback Instructions

If you need to undo this migration, run the rollback script:

### Option 1: Supabase Dashboard

1. Open SQL Editor
2. Copy contents of `supabase/migrations/20251112002_rollback_user_stories_enhancements.sql`
3. Paste and run
4. Verify columns are removed

### Option 2: Manual SQL

```sql
-- Drop indexes
DROP INDEX IF EXISTS idx_user_stories_priority_order;
DROP INDEX IF EXISTS idx_user_stories_project_priority_order;
DROP INDEX IF EXISTS idx_user_stories_dependencies;
DROP INDEX IF EXISTS idx_user_stories_generation_method;

-- Drop constraint
ALTER TABLE user_stories
DROP CONSTRAINT IF EXISTS valid_dependencies_structure;

-- Drop columns
ALTER TABLE user_stories
DROP COLUMN IF EXISTS description,
DROP COLUMN IF EXISTS priority_order,
DROP COLUMN IF EXISTS generation_method,
DROP COLUMN IF EXISTS dependencies;
```

## Troubleshooting

### Error: "column already exists"
- This migration may have already been run
- Check if columns exist: `\d user_stories` (in psql) or query information_schema

### Error: "index already exists"
- Drop the existing index manually and re-run

### Error: "check constraint is violated" during backfill
- Indicates data integrity issue
- Check for NULL values in priority or created_at fields

### Performance Issues After Migration
- Run `ANALYZE user_stories;` to update table statistics
- Verify indexes are being used with EXPLAIN ANALYZE

## Post-Migration Checklist

- [ ] All verification queries executed successfully
- [ ] Indexes are being used in query plans
- [ ] Constraint tests pass (valid values accepted, invalid values rejected)
- [ ] Existing user stories have priority_order values populated
- [ ] RLS policies still work correctly (test with project member queries)
- [ ] Application can read new columns without errors
- [ ] TypeScript types are updated to match new schema

## Next Steps

After verifying the migration:
1. Update TypeScript types (`lib/types/database.ts`)
2. Update Zod validation schemas (`lib/validations/user-story.ts`)
3. Update API endpoints to handle new fields
4. Update UI components to display new fields

See Task 2 in the tasks checklist for next implementation steps.
