-- Migration: Add entity name and ID to notifications
-- Created: 2025-12-17
-- Description: Adds entity_id and entity_name columns to track the specific item that was created

-- ============================================================================
-- ADD ENTITY COLUMNS
-- ============================================================================

-- Add entity_id to store reference to the created item
ALTER TABLE public.notifications
ADD COLUMN entity_id UUID;

-- Add entity_name to store the name/title of the created item
ALTER TABLE public.notifications
ADD COLUMN entity_name TEXT;

-- Create index for entity lookups
CREATE INDEX idx_notifications_entity_id
ON public.notifications(entity_id);

-- ============================================================================
-- UPDATE JOURNEY MAP TRIGGER TO INCLUDE ENTITY NAME
-- ============================================================================

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS journey_map_notification_trigger ON public.user_journey_maps;
DROP FUNCTION IF EXISTS public.notify_journey_map_created();

-- Create updated trigger function with entity_id and entity_name
CREATE OR REPLACE FUNCTION public.notify_journey_map_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert notifications for all project members (excluding the creator)
  INSERT INTO public.notifications (user_id, creator_id, project_id, entity_type, entity_count, action, entity_id, entity_name)
  SELECT pm.user_id, NEW.created_by, NEW.project_id, 'journey_map', 1, 'created', NEW.id, NEW.title
  FROM public.project_members pm
  WHERE pm.project_id = NEW.project_id AND pm.user_id != NEW.created_by;

  -- Insert notification for project owner if not already included
  INSERT INTO public.notifications (user_id, creator_id, project_id, entity_type, entity_count, action, entity_id, entity_name)
  SELECT p.user_id, NEW.created_by, NEW.project_id, 'journey_map', 1, 'created', NEW.id, NEW.title
  FROM public.projects p
  WHERE p.id = NEW.project_id AND p.user_id != NEW.created_by
  AND NOT EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = NEW.project_id AND pm.user_id = p.user_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER journey_map_notification_trigger
AFTER INSERT ON public.user_journey_maps
FOR EACH ROW
EXECUTE FUNCTION public.notify_journey_map_created();

-- ============================================================================
-- UPDATE USER STORY TRIGGER TO INCLUDE ENTITY NAME
-- ============================================================================

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS user_story_notification_trigger ON public.user_stories;
DROP FUNCTION IF EXISTS public.notify_user_story_created();

-- Create updated trigger function with entity_id and entity_name
CREATE OR REPLACE FUNCTION public.notify_user_story_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert notifications for all project members (excluding the creator)
  INSERT INTO public.notifications (user_id, creator_id, project_id, entity_type, entity_count, action, entity_id, entity_name)
  SELECT pm.user_id, NEW.created_by, NEW.project_id, 'user_story', 1, 'created', NEW.id, NEW.title
  FROM public.project_members pm
  WHERE pm.project_id = NEW.project_id AND pm.user_id != NEW.created_by;

  -- Insert notification for project owner if not already included
  INSERT INTO public.notifications (user_id, creator_id, project_id, entity_type, entity_count, action, entity_id, entity_name)
  SELECT p.user_id, NEW.created_by, NEW.project_id, 'user_story', 1, 'created', NEW.id, NEW.title
  FROM public.projects p
  WHERE p.id = NEW.project_id AND p.user_id != NEW.created_by
  AND NOT EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = NEW.project_id AND pm.user_id = p.user_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER user_story_notification_trigger
AFTER INSERT ON public.user_stories
FOR EACH ROW
EXECUTE FUNCTION public.notify_user_story_created();

-- ============================================================================
-- UPDATE PERSONA TRIGGER TO INCLUDE ENTITY NAME
-- ============================================================================

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS persona_notification_trigger ON public.personas;
DROP FUNCTION IF EXISTS public.notify_persona_created();

-- Create updated trigger function with entity_id and entity_name
CREATE OR REPLACE FUNCTION public.notify_persona_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert notifications for all project members (excluding the creator)
  INSERT INTO public.notifications (user_id, creator_id, project_id, entity_type, entity_count, action, entity_id, entity_name)
  SELECT pm.user_id, NEW.created_by, NEW.project_id, 'persona', 1, 'created', NEW.id, NEW.name
  FROM public.project_members pm
  WHERE pm.project_id = NEW.project_id AND pm.user_id != NEW.created_by;

  -- Insert notification for project owner if not already included
  INSERT INTO public.notifications (user_id, creator_id, project_id, entity_type, entity_count, action, entity_id, entity_name)
  SELECT p.user_id, NEW.created_by, NEW.project_id, 'persona', 1, 'created', NEW.id, NEW.name
  FROM public.projects p
  WHERE p.id = NEW.project_id AND p.user_id != NEW.created_by
  AND NOT EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = NEW.project_id AND pm.user_id = p.user_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER persona_notification_trigger
AFTER INSERT ON public.personas
FOR EACH ROW
EXECUTE FUNCTION public.notify_persona_created();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN public.notifications.entity_id IS 'UUID of the created entity (journey_map, user_story, persona, etc.)';
COMMENT ON COLUMN public.notifications.entity_name IS 'Name or title of the created entity';
