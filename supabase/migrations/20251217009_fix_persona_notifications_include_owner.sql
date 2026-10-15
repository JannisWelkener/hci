-- Migration: Fix persona notifications to include project owner
-- Created: 2025-12-17
-- Description: Updates trigger to notify both project members AND project owner

-- ============================================================================
-- UPDATE TRIGGER FUNCTION FOR PERSONA NOTIFICATIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.notify_project_members_persona()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert notifications for all project members (excluding the creator)
  INSERT INTO public.notifications (user_id, creator_id, project_id, entity_type, entity_count, action)
  SELECT
    pm.user_id,
    NEW.created_by,
    NEW.project_id,
    'persona',
    1,
    'created'
  FROM public.project_members pm
  WHERE pm.project_id = NEW.project_id
    AND pm.user_id != NEW.created_by;

  -- Insert notification for project owner if not already included
  INSERT INTO public.notifications (user_id, creator_id, project_id, entity_type, entity_count, action)
  SELECT
    p.user_id,
    NEW.created_by,
    NEW.project_id,
    'persona',
    1,
    'created'
  FROM public.projects p
  WHERE p.id = NEW.project_id
    AND p.user_id != NEW.created_by
    AND NOT EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = NEW.project_id
      AND pm.user_id = p.user_id
    );

  -- Also create a notification for the creator (for history, but won't count in badge)
  INSERT INTO public.notifications (user_id, creator_id, project_id, entity_type, entity_count, action)
  VALUES (
    NEW.created_by,
    NEW.created_by,
    NEW.project_id,
    'persona',
    1,
    'created'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
