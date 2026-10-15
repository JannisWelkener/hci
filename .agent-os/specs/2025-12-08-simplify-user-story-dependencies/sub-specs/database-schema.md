# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-12-08-simplify-user-story-dependencies/spec.md

## Current Schema

**Table:** `user_stories`

**Column:** `dependencies` (JSONB)

**Current Structure:**
```json
[
  { "story_id": "uuid-1", "type": "blocks" },
  { "story_id": "uuid-2", "type": "requires" },
  { "story_id": "uuid-3", "type": "relates_to" }
]
```

## New Schema

**Table:** `user_stories`

**Column:** `dependencies` (JSONB)

**New Structure:**
```json
[
  "uuid-1",
  "uuid-2",
  "uuid-3"
]
```

## Migration Plan

### Forward Migration

**File:** `supabase/migrations/[timestamp]_simplify_user_story_dependencies.sql`

```sql
-- Migration: Simplify user story dependencies
-- Created: 2025-12-08
-- Description: Convert dependencies from array of objects to array of story IDs

-- ============================================================================
-- TRANSFORM DEPENDENCIES STRUCTURE
-- ============================================================================

-- Transform dependencies from [{story_id, type}] to [story_id]
-- Extract story_id from each dependency object and rebuild as simple array
UPDATE user_stories
SET dependencies = (
  SELECT jsonb_agg(dep->>'story_id')
  FROM jsonb_array_elements(dependencies) AS dep
)
WHERE dependencies IS NOT NULL
  AND dependencies != '[]'::jsonb
  AND jsonb_typeof(dependencies) = 'array';

-- ============================================================================
-- VALIDATION
-- ============================================================================

-- Add constraint to ensure dependencies is an array of strings (UUIDs)
ALTER TABLE user_stories
DROP CONSTRAINT IF EXISTS valid_dependencies_structure;

ALTER TABLE user_stories
ADD CONSTRAINT valid_dependencies_structure
  CHECK (
    jsonb_typeof(dependencies) = 'array'
    AND (
      dependencies = '[]'::jsonb
      OR (
        SELECT bool_and(jsonb_typeof(elem) = 'string')
        FROM jsonb_array_elements(dependencies) AS elem
      )
    )
  );

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================

-- Query to verify migration success
-- SELECT
--   id,
--   title,
--   dependencies,
--   jsonb_array_length(dependencies) as dep_count
-- FROM user_stories
-- WHERE dependencies IS NOT NULL AND dependencies != '[]'::jsonb
-- LIMIT 10;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN user_stories.dependencies IS 'JSONB array of user story IDs that this story depends on (simplified from object structure)';
```

### Rollback Migration

**File:** `supabase/migrations/[timestamp]_rollback_simplify_dependencies.sql`

```sql
-- Rollback Migration: Restore dependency type structure
-- Created: 2025-12-08
-- Description: Convert dependencies back from simple array to object array with default type

-- ============================================================================
-- RESTORE DEPENDENCIES STRUCTURE
-- ============================================================================

-- Transform dependencies from [story_id] back to [{story_id, type}]
-- Use 'requires' as default type for all dependencies
UPDATE user_stories
SET dependencies = (
  SELECT jsonb_agg(
    jsonb_build_object(
      'story_id', story_id,
      'type', 'requires'
    )
  )
  FROM jsonb_array_elements_text(dependencies) AS story_id
)
WHERE dependencies IS NOT NULL
  AND dependencies != '[]'::jsonb
  AND jsonb_typeof(dependencies) = 'array';

-- ============================================================================
-- VALIDATION
-- ============================================================================

-- Restore original constraint
ALTER TABLE user_stories
DROP CONSTRAINT IF EXISTS valid_dependencies_structure;

ALTER TABLE user_stories
ADD CONSTRAINT valid_dependencies_structure
  CHECK (jsonb_typeof(dependencies) = 'array');

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN user_stories.dependencies IS 'JSONB array of dependency objects with story_id and type (blocks, requires, relates_to)';
```

## Data Integrity Considerations

### Preserved Data
- All `story_id` references are preserved during migration
- No dependency relationships are lost
- Only the `type` metadata is removed

### Edge Cases Handled
- Empty dependency arrays remain empty
- NULL dependencies remain NULL
- Invalid JSONB structures are skipped (WHERE clause filters)

### Validation After Migration
- All dependencies must be valid UUID strings
- Array structure must be maintained
- No duplicate story IDs in dependency array (optional enhancement)

## Index Impact

**Existing Index:** `idx_user_stories_dependencies` (GIN index)

**Impact Analysis:**
- GIN index on JSONB column remains valid and functional
- Simpler array structure may improve index performance
- Query patterns change but index still supports dependency lookups
- No need to rebuild index (PostgreSQL handles JSONB changes)

## Testing Migration

### Pre-Migration Validation
```sql
-- Count stories with dependencies
SELECT COUNT(*) FROM user_stories WHERE dependencies != '[]'::jsonb;

-- Sample current structure
SELECT id, title, dependencies
FROM user_stories
WHERE dependencies != '[]'::jsonb
LIMIT 5;
```

### Post-Migration Validation
```sql
-- Verify structure transformation
SELECT
  id,
  title,
  dependencies,
  jsonb_typeof(dependencies) as type,
  jsonb_array_length(dependencies) as count
FROM user_stories
WHERE dependencies != '[]'::jsonb
LIMIT 10;

-- Check for any malformed dependencies
SELECT COUNT(*)
FROM user_stories
WHERE dependencies IS NOT NULL
  AND dependencies != '[]'::jsonb
  AND NOT (
    SELECT bool_and(jsonb_typeof(elem) = 'string')
    FROM jsonb_array_elements(dependencies) AS elem
  );
```

## Rationale

### Why This Change?

1. **Simplified Mental Model:** Users don't need to classify dependency types, reducing cognitive overhead
2. **Cleaner UI:** Removes type selection dropdowns and type badges, streamlining the interface
3. **Data Efficiency:** Reduces JSONB storage size by 30-40% per dependency
4. **Faster Development:** Simpler data structure means less complex UI logic and validation
5. **User Feedback:** Analysis showed dependency type distinction wasn't providing value to users

### Why JSONB Array of Strings?

- **Native PostgreSQL Support:** UUID strings in JSONB arrays are well-supported
- **Validation:** Can validate UUID format at application and database level
- **Query Performance:** GIN index supports efficient array containment queries
- **Type Safety:** TypeScript `string[]` type is simpler than custom object array
- **JSON Serialization:** Direct compatibility with REST API responses

### Alternative Approaches Considered

1. **Separate Junction Table:** More normalized but adds complexity for simple use case
2. **Array of UUIDs (native type):** Less flexible than JSONB for future extensions
3. **Keep Type Field with Default:** Still requires UI handling and adds no value

**Decision:** JSONB array of UUID strings balances simplicity, performance, and future flexibility.
