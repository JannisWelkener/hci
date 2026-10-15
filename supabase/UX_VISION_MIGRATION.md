# UX Vision Migration Guide

## Overview
This migration adds a new UX Vision feature to the HCI Hub application. Each project can have a single UX vision statement that guides all design decisions.

## Migration Files
- `20260108001_add_ux_visions.sql` - Creates the ux_visions table
- `20260108002_rollback_ux_visions.sql` - Rollback script

## Running the Migration

### Using Supabase CLI

```bash
# Apply the migration
supabase db push

# Or apply a specific migration
supabase migration up --version 20260108001
```

### Rollback

If you need to rollback:

```bash
supabase migration down --version 20260108001
```

## Database Schema

### Table: `ux_visions`

| Column      | Type        | Constraints                           | Description                     |
|-------------|-------------|---------------------------------------|---------------------------------|
| id          | UUID        | PRIMARY KEY, DEFAULT gen_random_uuid()| Unique identifier               |
| project_id  | UUID        | REFERENCES projects(id) ON DELETE CASCADE, UNIQUE | Project reference (one vision per project) |
| vision      | TEXT        | NOT NULL, CHECK (length 1-5000)       | UX vision statement             |
| created_at  | TIMESTAMPTZ | NOT NULL, DEFAULT now()               | Creation timestamp              |
| updated_at  | TIMESTAMPTZ | NOT NULL, DEFAULT now()               | Last update timestamp           |
| created_by  | UUID        | REFERENCES auth.users(id)             | User who created the vision     |

### Indexes
- `idx_ux_visions_project_id` - Index on project_id for fast lookups

### RLS Policies
- View: Project members can view UX visions
- Create: Project members can create UX visions
- Update: Project members can update UX visions
- Delete: Project members can delete UX visions

## Features

### Frontend Components
- **Page**: `/projects/[projectId]/ux-vision` - Main UX Vision page with large text field
- **Navigation**: Added to ProjectSidebar with Lightbulb icon

### API Routes
- `GET /api/projects/[id]/ux-vision` - Fetch project's UX vision
- `POST /api/projects/[id]/ux-vision` - Create or update UX vision (upsert)

### Hooks
- `useUXVision(projectId)` - Fetch UX vision
- `useUpsertUXVision(projectId)` - Create or update UX vision

## Usage

Users can navigate to the UX Vision page from the project sidebar and:
1. Enter their UX vision statement (up to 5000 characters)
2. Save the vision
3. Edit/update it at any time
4. The vision is displayed in a large, prominent text field for easy reading

## Testing

1. Navigate to a project
2. Click "UX Vision" in the sidebar
3. Enter a vision statement
4. Click "Save Vision"
5. Verify the vision is saved and persists on page reload
6. Try editing the vision and saving again
