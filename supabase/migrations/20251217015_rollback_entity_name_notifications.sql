-- Migration Rollback: Remove entity name and ID from notifications
-- Created: 2025-12-17
-- Description: Rollback for adding entity_id and entity_name to notifications

-- ============================================================================
-- RESTORE ORIGINAL TRIGGERS (WITHOUT ENTITY NAME)
-- ============================================================================

-- Restore Journey Map trigger
DROP TRIGGER IF EXISTS journey_map_notification_trigger ON public.user_journey_maps;
DROP FUNCTION IF EXISTS public.notify_journey_map_created();

CREATE OR REPLACE FUNCTION public.notify_journey_map_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, creator_id, project_id, entity_type, entity_count, action)
  SELECT pm.user_id, NEW.created_by, NEW.project_id, 'journey_map', 1, 'created'
  FROM public.project_members pm
  WHERE pm.project_id = NEW.project_id AND pm.user_id != NEW.created_by;

  INSERT INTO public.notifications (user_id, creator_id, project_id, entity_type, entity_count, action)
  SELECT p.user_id, NEW.created_by, NEW.project_id, 'journey_map', 1, 'created'
  FROM public.projects p
  WHERE p.id = NEW.project_id AND p.user_id != NEW.created_by
  AND NOT EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = NEW.project_id AND pm.user_id = p.user_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER journey_map_notification_trigger
AFTER INSERT ON public.user_journey_maps
FOR EACH ROW
EXECUTE FUNCTION public.notify_journey_map_created();

-- Restore User Story trigger
DROP TRIGGER IF EXISTS user_story_notification_trigger ON public.user_stories;
DROP FUNCTION IF EXISTS public.notify_user_story_created();

CREATE OR REPLACE FUNCTION public.notify_user_story_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, creator_id, project_id, entity_type, entity_count, action)
  SELECT pm.user_id, NEW.created_by, NEW.project_id, 'user_story', 1, 'created'
  FROM public.project_members pm
  WHERE pm.project_id = NEW.project_id AND pm.user_id != NEW.created_by;

  INSERT INTO public.notifications (user_id, creator_id, project_id, entity_type, entity_count, action)
  SELECT p.user_id, NEW.created_by, NEW.project_id, 'user_story', 1, 'created'
  FROM public.projects p
  WHERE p.id = NEW.project_id AND p.user_id != NEW.created_by
  AND NOT EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = NEW.project_id AND pm.user_id = p.user_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER user_story_notification_trigger
AFTER INSERT ON public.user_stories
FOR EACH ROW
EXECUTE FUNCTION public.notify_user_story_created();

-- Restore Persona trigger
DROP TRIGGER IF EXISTS persona_notification_trigger ON public.personas;
DROP FUNCTION IF EXISTS public.notify_persona_created();

CREATE OR REPLACE FUNCTION public.notify_persona_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, creator_id, project_id, entity_type, entity_count, action)
  SELECT pm.user_id, NEW.created_by, NEW.project_id, 'persona', 1, 'created'
  FROM public.project_members pm
  WHERE pm.project_id = NEW.project_id AND pm.user_id != NEW.created_by;

  INSERT INTO public.notifications (user_id, creator_id, project_id, entity_type, entity_count, action)
  SELECT p.user_id, NEW.created_by, NEW.project_id, 'persona', 1, 'created'
  FROM public.projects p
  WHERE p.id = NEW.project_id AND p.user_id != NEW.created_by
  AND NOT EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = NEW.project_id AND pm.user_id = p.user_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER persona_notification_trigger
AFTER INSERT ON public.personas
FOR EACH ROW
EXECUTE FUNCTION public.notify_persona_created();

-- ============================================================================
-- DROP INDEX
-- ============================================================================

DROP INDEX IF EXISTS idx_notifications_entity_id;

-- ============================================================================
-- REMOVE COLUMNS
-- ============================================================================

ALTER TABLE public.notifications
DROP COLUMN IF EXISTS entity_name;

ALTER TABLE public.notifications
DROP COLUMN IF EXISTS entity_id;
