# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-11-12-user-stories-enhancement/spec.md

## Overview

This enhancement adds four new columns to the existing `user_stories` table to support description storage, drag-and-drop priority ordering, dependency tracking, and AI generation tracking. No new tables are required as dependencies will be stored in JSONB format for simplicity and performance.

## Schema Changes

### Modified Table: user_stories

Add the following columns to the existing `user_stories` table:

```sql
-- Add description column for storing story context and AI generation input
ALTER TABLE user_stories
ADD COLUMN description TEXT DEFAULT NULL;

-- Add priority_order column for explicit drag-and-drop ordering
ALTER TABLE user_stories
ADD COLUMN priority_order INTEGER NOT NULL DEFAULT 0;

-- Add generation_method column to track creation method
ALTER TABLE user_stories
ADD COLUMN generation_method TEXT NOT NULL DEFAULT 'manual'
  CHECK (generation_method IN ('manual', 'ai_generated'));

-- Add dependencies column to store story relationships as JSONB
ALTER TABLE user_stories
ADD COLUMN dependencies JSONB DEFAULT '[]'::jsonb;

-- Add constraint to validate dependencies array structure
ALTER TABLE user_stories
ADD CONSTRAINT valid_dependencies_structure
  CHECK (jsonb_typeof(dependencies) = 'array');
```

### Column Specifications

#### description
- **Type**: TEXT
- **Nullable**: Yes (NULL allowed)
- **Default**: NULL
- **Purpose**: Stores the original description or context for the user story. Used as input for AI generation in AI mode and as additional documentation in manual mode.
- **Max Length**: No database constraint, validated at application level (2000 characters)
- **Migration**: Existing stories will have NULL description

#### priority_order
- **Type**: INTEGER
- **Nullable**: No
- **Default**: 0
- **Purpose**: Explicit ordering value for drag-and-drop reordering. Separate from priority level (low/medium/high/critical) to allow custom sorting.
- **Range**: Any integer value, typically spaced at 1000 intervals for easy reordering
- **Migration**: Backfill with calculated values based on existing priority and created_at
- **Index**: Create index for performance on ORDER BY queries

#### generation_method
- **Type**: TEXT (ENUM-like with CHECK constraint)
- **Nullable**: No
- **Default**: 'manual'
- **Allowed Values**: 'manual' | 'ai_generated'
- **Purpose**: Tracks how the user story was created (manual entry vs AI generation)
- **Migration**: All existing stories default to 'manual'

#### dependencies
- **Type**: JSONB
- **Nullable**: No (defaults to empty array)
- **Default**: '[]'::jsonb
- **Structure**: Array of dependency objects
  ```typescript
  type Dependency = {
    story_id: string;     // UUID of dependent story
    type: 'blocks' | 'requires' | 'relates_to';  // Dependency type
  };
  ```
- **Example**:
  ```json
  [
    {
      "story_id": "123e4567-e89b-12d3-a456-426614174000",
      "type": "blocks"
    },
    {
      "story_id": "123e4567-e89b-12d3-a456-426614174001",
      "type": "requires"
    }
  ]
  ```
- **Constraint**: Validated to be a JSONB array type
- **Migration**: Existing stories get empty array []

## Indexes

Create indexes for optimal query performance:

```sql
-- Index on priority_order for efficient sorting
CREATE INDEX idx_user_stories_priority_order
ON user_stories(priority_order ASC);

-- Composite index for project_id + priority_order (most common query)
CREATE INDEX idx_user_stories_project_priority
ON user_stories(project_id, priority_order ASC);

-- GIN index on dependencies JSONB for efficient dependency lookups
CREATE INDEX idx_user_stories_dependencies
ON user_stories USING GIN (dependencies);

-- Index on generation_method for filtering/analytics
CREATE INDEX idx_user_stories_generation_method
ON user_stories(generation_method);
```

### Index Rationale

- **idx_user_stories_priority_order**: Speeds up ORDER BY priority_order queries
- **idx_user_stories_project_priority**: Composite index for the most common query pattern (fetch stories for a project ordered by priority)
- **idx_user_stories_dependencies**: GIN index enables efficient JSONB containment queries (e.g., finding all stories that depend on a specific story)
- **idx_user_stories_generation_method**: Supports filtering and analytics on generation method

## Migration Script

### Forward Migration (20251112_add_user_stories_enhancements.sql)

```sql
-- Migration: Add user stories enhancement columns
-- Created: 2025-11-12
-- Description: Adds description, priority_order, generation_method, and dependencies columns

BEGIN;

-- Add new columns
ALTER TABLE user_stories
ADD COLUMN description TEXT DEFAULT NULL,
ADD COLUMN priority_order INTEGER NOT NULL DEFAULT 0,
ADD COLUMN generation_method TEXT NOT NULL DEFAULT 'manual'
  CHECK (generation_method IN ('manual', 'ai_generated')),
ADD COLUMN dependencies JSONB DEFAULT '[]'::jsonb,
ADD CONSTRAINT valid_dependencies_structure
  CHECK (jsonb_typeof(dependencies) = 'array');

-- Backfill priority_order with calculated values
-- Formula: (priority_level_weight * 1000000) + (epoch_seconds)
-- This ensures high priority items come first, with creation time as tiebreaker
UPDATE user_stories
SET priority_order = (
  CASE priority
    WHEN 'critical' THEN 1000000
    WHEN 'high' THEN 2000000
    WHEN 'medium' THEN 3000000
    WHEN 'low' THEN 4000000
    ELSE 5000000
  END + EXTRACT(EPOCH FROM created_at)::INTEGER
);

-- Create indexes
CREATE INDEX idx_user_stories_priority_order
ON user_stories(priority_order ASC);

CREATE INDEX idx_user_stories_project_priority
ON user_stories(project_id, priority_order ASC);

CREATE INDEX idx_user_stories_dependencies
ON user_stories USING GIN (dependencies);

CREATE INDEX idx_user_stories_generation_method
ON user_stories(generation_method);

-- Update updated_at timestamp
UPDATE user_stories
SET updated_at = NOW()
WHERE updated_at < NOW();

COMMIT;
```

### Rollback Migration (20251112_add_user_stories_enhancements_rollback.sql)

```sql
-- Rollback Migration: Remove user stories enhancement columns
-- Created: 2025-11-12

BEGIN;

-- Drop indexes
DROP INDEX IF EXISTS idx_user_stories_priority_order;
DROP INDEX IF EXISTS idx_user_stories_project_priority;
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

COMMIT;
```

## Data Integrity Rules

### Dependency Validation

While database constraints ensure the JSONB structure is valid, application-level validation should enforce:

1. **No Self-References**: A story cannot depend on itself
   ```typescript
   dependencies.every(dep => dep.story_id !== currentStoryId)
   ```

2. **Valid Story IDs**: All story_id values must reference existing user_stories in the same project
   ```sql
   -- Example query to validate dependencies
   SELECT d.story_id
   FROM user_stories us,
        jsonb_to_recordset(us.dependencies) AS d(story_id UUID, type TEXT)
   WHERE us.id = $1
     AND NOT EXISTS (
       SELECT 1 FROM user_stories us2
       WHERE us2.id = d.story_id
         AND us2.project_id = us.project_id
     );
   ```

3. **Valid Dependency Types**: Type must be one of: 'blocks', 'requires', 'relates_to'

4. **Circular Dependency Warning** (optional): Detect and warn about circular dependencies
   - Not enforced at database level due to complexity
   - Implemented in application layer

### Priority Order Management

1. **Uniqueness**: priority_order values do not need to be unique (multiple stories can have same order)
2. **Gaps**: Maintain gaps of ~1000 between adjacent stories for easy reordering
3. **Rebalancing**: When gaps become too small (<10), trigger rebalancing to restore 1000-unit gaps
4. **Default Ordering**: New stories get `priority_order = MAX(priority_order) + 1000`

## Performance Considerations

### Query Optimization

**Fetching stories with dependency count**:
```sql
SELECT
  us.*,
  jsonb_array_length(us.dependencies) as dependency_count
FROM user_stories us
WHERE us.project_id = $1
ORDER BY us.priority_order ASC
LIMIT 50;
```

**Finding stories that depend on a specific story**:
```sql
SELECT us.*
FROM user_stories us
WHERE us.project_id = $1
  AND us.dependencies @> jsonb_build_array(
    jsonb_build_object('story_id', $2)
  );
```

**Finding all related stories (bidirectional dependencies)**:
```sql
-- Stories this story depends on
SELECT us.*
FROM user_stories us,
     jsonb_to_recordset($2::jsonb) AS deps(story_id UUID, type TEXT)
WHERE us.id = deps.story_id

UNION

-- Stories that depend on this story
SELECT us.*
FROM user_stories us
WHERE us.dependencies @> jsonb_build_array(
  jsonb_build_object('story_id', $1)
);
```

### Storage Impact

- **description**: ~100-500 bytes per story (TEXT field)
- **priority_order**: 4 bytes per story (INTEGER)
- **generation_method**: ~10-15 bytes per story (TEXT with short values)
- **dependencies**: ~50-200 bytes per story depending on number of dependencies (JSONB)

**Total**: ~200-700 bytes per story (minimal impact)

For 1000 user stories: ~0.2-0.7 MB additional storage

## Row Level Security (RLS) Updates

The existing RLS policies on `user_stories` table should automatically cover the new columns:

```sql
-- Verify existing policies still work with new columns
-- No changes needed if policies are based on project_id and user membership

-- Example existing policy (no modification needed):
CREATE POLICY "Users can view user stories for their projects"
ON user_stories FOR SELECT
USING (
  project_id IN (
    SELECT project_id FROM project_members WHERE user_id = auth.uid()
  )
);
```

New columns inherit the same access control as the rest of the row.

## Testing Checklist

- [ ] Migration runs successfully on test database
- [ ] Rollback migration cleanly removes all changes
- [ ] Indexes are created and used in query plans (EXPLAIN ANALYZE)
- [ ] Existing user stories are properly backfilled with default values
- [ ] JSONB constraint validates dependencies array structure
- [ ] CHECK constraint validates generation_method enum values
- [ ] RLS policies still enforce project-level access control
- [ ] Query performance is acceptable with new indexes (< 100ms for typical queries)
- [ ] Foreign key integrity maintained (project_id references projects)
