-- Migration Rollback: Remove user story notifications trigger
-- Created: 2025-12-17
-- Description: Rollback script to remove user story notification trigger

-- ============================================================================
-- DROP TRIGGER AND FUNCTION
-- ============================================================================

-- Drop trigger for user stories
DROP TRIGGER IF EXISTS user_story_notification_trigger ON public.user_stories;

-- Drop trigger function
DROP FUNCTION IF EXISTS public.notify_project_members_user_story();
