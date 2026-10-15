# Notifications Migration Guide

## Overview

This migration adds the notifications table and triggers to track project activity (Journey Maps, User Stories, and Personas) for team collaboration.

**Migration Files:**
- `20251217001_add_notifications.sql` - Creates notifications table
- `20251217002_rollback_notifications.sql` - Rollback for notifications table
- `20251217003_add_user_story_notifications.sql` - Adds User Story notification trigger
- `20251217004_rollback_user_story_notifications.sql` - Rollback for User Story trigger
- `20251217005_add_persona_notifications.sql` - Adds Persona notification trigger
- `20251217006_rollback_persona_notifications.sql` - Rollback for Persona trigger
- `20251217007_fix_user_story_notifications_include_owner.sql` - **FIX: Include project owner**
- `20251217008_fix_journey_map_notifications_include_owner.sql` - **FIX: Include project owner**
- `20251217009_fix_persona_notifications_include_owner.sql` - **FIX: Include project owner**
- `20251217010_allow_viewing_project_member_profiles.sql` - **CRITICAL FIX: Allow viewing project member names**
- `20251217011_rollback_project_member_profiles.sql` - Rollback for profile viewing
- `20251217012_add_notification_read_status.sql` - **NEW: Add read status to notifications**
- `20251217013_rollback_notification_read_status.sql` - Rollback for read status
- `20251217014_add_entity_name_to_notifications.sql` - **NEW: Add entity names to notifications**
- `20251217015_rollback_entity_name_notifications.sql` - Rollback for entity names
- `20251217016_add_mockup_wireframe_notifications.sql` - **NEW: Add mockup and wireframe notifications**
- `20251217017_rollback_mockup_wireframe_notifications.sql` - Rollback for mockup/wireframe notifications

## What This Migration Does

1. **Creates `notifications` table** with:
   - User notifications for project activity
   - Support for journey_map, persona, user_story, prototype entity types
   - Created/updated/deleted action tracking
   - Entity count aggregation

2. **Creates indexes** for:
   - Fast user notification queries
   - Efficient creator filtering (exclude own changes from badge)
   - Project-based filtering
   - Composite queries with timestamps

3. **Implements RLS policies** to:
   - Allow users to view only their own notifications
   - Allow system to create notifications for all project members
   - Prevent manual deletion/updates

4. **Creates trigger functions** to:
   - Auto-generate notifications when Journey Maps, User Stories, or Personas are created
   - Send notification to all project members (including creator for history)
   - Store action metadata (creator, project, count)
   - Three separate triggers for each entity type

## Prerequisites

- Supabase CLI installed and configured
- `user_journey_maps` table must exist
- `user_stories` table must exist
- `personas` table must exist
- `project_members` table must exist
- `profiles` table must exist

## How to Apply

### Option 1: Via Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run migrations in order:
   - Copy and run `migrations/20251217001_add_notifications.sql` (creates table)
   - Copy and run `migrations/20251217003_add_user_story_notifications.sql` (User Story trigger)
   - Copy and run `migrations/20251217005_add_persona_notifications.sql` (Persona trigger)
   - **IMPORTANT:** Copy and run `migrations/20251217007_fix_user_story_notifications_include_owner.sql` (fixes User Story trigger)
   - Copy and run `migrations/20251217008_fix_journey_map_notifications_include_owner.sql` (fixes Journey Map trigger)
   - Copy and run `migrations/20251217009_fix_persona_notifications_include_owner.sql` (fixes Persona trigger)
   - **CRITICAL:** Copy and run `migrations/20251217010_allow_viewing_project_member_profiles.sql` (allows viewing creator names)
   - **NEW:** Copy and run `migrations/20251217012_add_notification_read_status.sql` (adds read status tracking)
   - **NEW:** Copy and run `migrations/20251217014_add_entity_name_to_notifications.sql` (adds entity names to show specific items)
   - **NEW:** Copy and run `migrations/20251217016_add_mockup_wireframe_notifications.sql` (adds mockup and wireframe notifications)
4. Verify success in the **Table Editor**

**Note:**
- Migrations 007-009 ensure project owners receive notifications
- Migration 010 is CRITICAL - it allows users to see the names of people in their projects (required for notifications to display creator names)
- Migration 012 adds read status - notifications are automatically marked as read when you open the dropdown
- Migration 014 adds entity names - notifications now show the specific name of the item created (e.g., "User Story: 'Login Authentication'")
- Migration 016 adds mockup and wireframe support - notifications track when mockups (🎭) and wireframes (📐) are created

### Option 2: Via Supabase CLI

```bash
# Apply migration
supabase db push

# Or apply specific migration
supabase migration up --version 20251217001
```

## Verification

After applying the migration, verify:

1. **Table exists:**
   ```sql
   SELECT * FROM public.notifications LIMIT 1;
   ```

2. **Indexes created:**
   ```sql
   SELECT indexname FROM pg_indexes WHERE tablename = 'notifications';
   ```

3. **RLS policies active:**
   ```sql
   SELECT policyname FROM pg_policies WHERE tablename = 'notifications';
   ```

4. **Triggers exist:**
   ```sql
   SELECT trigger_name, event_object_table
   FROM information_schema.triggers
   WHERE trigger_name IN (
     'journey_map_notification_trigger',
     'user_story_notification_trigger',
     'persona_notification_trigger'
   );
   ```

5. **Test triggers** by creating a Journey Map, User Story, or Persona and checking notifications table

## Rollback

If you need to rollback:

```bash
# Via Supabase CLI
supabase migration up --version 20251217002

# Or via SQL Editor
# Run the contents of migrations/20251217002_rollback_notifications.sql
```

## Notes

- Existing Journey Maps, User Stories, and Personas will NOT generate historical notifications (only new creations)
- The triggers create notifications for all project members including the creator
- Creator's own notifications appear in list but don't increment the badge count (handled in frontend)
- All three entity types (Journey Maps, User Stories, Personas) are now tracked
- Future entity types (e.g., prototypes, wireframes) can be added by creating similar triggers

## Troubleshooting

**Issue: Trigger not firing**
- Verify `user_journey_maps`, `user_stories`, and `personas` tables exist
- Check that `created_by` column exists in all three tables
- Ensure project has members in `project_members` table

**Issue: RLS blocking queries**
- Verify you're authenticated (auth.uid() returns a value)
- Check that `user_id` in notifications matches authenticated user

**Issue: Duplicate notifications**
- This is expected if the same user creates multiple Journey Maps
- Each creation event generates separate notification rows

**Issue: Project owner not receiving notifications**
- This was a bug in migrations 003-005 (before the fixes)
- Solution: Run migrations 007-009 which fix the triggers to include project owners
- The owner might not be in the `project_members` table, so we check both tables now

**Issue: Notifications not showing in UI / Query fails silently**
- Cause: The profiles table RLS policy blocked viewing other users' names
- Solution: Run migration 010 which allows users to view profiles of people in their projects
- Without this, the notification query fails when trying to join with profiles for creator names
