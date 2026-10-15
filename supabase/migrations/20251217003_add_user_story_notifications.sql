-- Migration: Add user story notifications trigger
-- Created: 2025-12-17
-- Description: Creates trigger to auto-generate notifications when user stories are created

-- ============================================================================
-- TRIGGER FUNCTION FOR USER STORY NOTIFICATIONS
-- ============================================================================

-- Function to create notifications for all project members when a user story is created
CREATE OR REPLACE FUNCTION public.notify_project_members_user_story()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert one notification per project member (excluding the creator)
  INSERT INTO public.notifications (user_id, creator_id, project_id, entity_type, entity_count, action)
  SELECT
    pm.user_id,
    NEW.created_by,
    NEW.project_id,
    'user_story',
    1,
    'created'
  FROM public.project_members pm
  WHERE pm.project_id = NEW.project_id
    AND pm.user_id != NEW.created_by;

  -- Also create a notification for the creator (for history, but won't count in badge)
  INSERT INTO public.notifications (user_id, creator_id, project_id, entity_type, entity_count, action)
  VALUES (
    NEW.created_by,
    NEW.created_by,
    NEW.project_id,
    'user_story',
    1,
    'created'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for user_stories table
CREATE TRIGGER user_story_notification_trigger
AFTER INSERT ON public.user_stories
FOR EACH ROW
EXECUTE FUNCTION public.notify_project_members_user_story();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION public.notify_project_members_user_story() IS 'Auto-generates notifications for all project members when a user story is created';
