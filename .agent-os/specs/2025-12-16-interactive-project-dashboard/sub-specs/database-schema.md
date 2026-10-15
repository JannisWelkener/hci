# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-12-16-interactive-project-dashboard/spec.md

## Overview

No new tables are required. The dashboard will aggregate data from existing tables (user_stories, personas, user_journeys, mockups, wireframes) that should already exist in the database.

## Required Existing Tables

The following tables must exist with these minimum columns:

### user_stories
- `id` (primary key)
- `project_id` (foreign key to projects table)
- `updated_at` (timestamp)

### personas
- `id` (primary key)
- `project_id` (foreign key to projects table)
- `updated_at` (timestamp)

### user_journeys
- `id` (primary key)
- `project_id` (foreign key to projects table)
- `updated_at` (timestamp)

### mockups
- `id` (primary key)
- `project_id` (foreign key to projects table)
- `updated_at` (timestamp)

### wireframes
- `id` (primary key)
- `project_id` (foreign key to projects table)
- `updated_at` (timestamp)

## Database Queries

The dashboard will execute the following aggregation queries:

```sql
-- Get count and last updated for user stories
SELECT
  COUNT(*) as count,
  MAX(updated_at) as last_updated
FROM user_stories
WHERE project_id = $1;

-- Get count and last updated for personas
SELECT
  COUNT(*) as count,
  MAX(updated_at) as last_updated
FROM personas
WHERE project_id = $1;

-- Get count and last updated for user journeys
SELECT
  COUNT(*) as count,
  MAX(updated_at) as last_updated
FROM user_journeys
WHERE project_id = $1;

-- Get count and last updated for mockups
SELECT
  COUNT(*) as count,
  MAX(updated_at) as last_updated
FROM mockups
WHERE project_id = $1;

-- Get count and last updated for wireframes
SELECT
  COUNT(*) as count,
  MAX(updated_at) as last_updated
FROM wireframes
WHERE project_id = $1;
```

## Performance Considerations

- **Indexes**: Ensure `project_id` and `updated_at` columns are indexed on all tables for fast aggregation queries
- **Caching**: Consider caching aggregated counts at the application layer (React Query) to reduce database load
- **Query Optimization**: Use database views or materialized views if aggregation queries become slow with large datasets

## Migration Notes

If any of the required tables (user_stories, personas, user_journeys, mockups, wireframes) do not exist, they must be created before implementing the dashboard. Each table should follow this basic structure:

```sql
CREATE TABLE [table_name] (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Additional table-specific columns
);

CREATE INDEX idx_[table_name]_project_id ON [table_name](project_id);
CREATE INDEX idx_[table_name]_updated_at ON [table_name](updated_at);
```
