# How to Run Supabase Migrations

This document provides instructions for running the database migrations for HCI Hub.

## Method 1: Using Supabase Dashboard (Easiest)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Create a new query
4. Copy the entire contents of the migration file: `supabase/migrations/20251007008_enhance_projects_for_collaboration.sql`
5. Paste it into the SQL editor
6. Click **Run** to execute the migration
7. Verify success by checking the **Table Editor** for the new `project_members` table and updated `projects` table columns

## Method 2: Using Supabase CLI (Recommended for development)

### Prerequisites
Install Supabase CLI if you haven't already:
```bash
npm install -g supabase
```

### Steps
1. Initialize Supabase in your project (if not already done):
   ```bash
   supabase init
   ```

2. Link your project to Supabase:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

3. Run pending migrations:
   ```bash
   supabase db push
   ```

## Verification

After running the migration, verify the changes:

### Check new table:
```sql
SELECT * FROM public.project_members LIMIT 1;
```

### Check updated columns:
```sql
SELECT
  id,
  name,
  start_date,
  phase_status
FROM public.projects
LIMIT 1;
```

### Check RLS policies:
```sql
SELECT
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('projects', 'project_members');
```

## Rollback (if needed)

If you need to rollback the migration, run this SQL:

```sql
-- Drop project_members table
DROP TABLE IF EXISTS public.project_members CASCADE;

-- Remove new columns from projects
ALTER TABLE public.projects DROP COLUMN IF EXISTS start_date;
ALTER TABLE public.projects DROP COLUMN IF EXISTS phase_status;

-- Restore original RLS policies
-- (Copy from previous migration or recreate as needed)
```

## Troubleshooting

**Error: "relation projects does not exist"**
- Make sure the projects table exists first
- Run earlier migrations in order

**Error: "function handle_updated_at() does not exist"**
- Check that the profiles migration created this function
- Add the function manually if needed

**RLS policy conflicts**
- Drop existing policies before creating new ones (already handled in migration)
