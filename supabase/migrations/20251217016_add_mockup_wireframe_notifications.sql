-- Migration: Add mockup and wireframe notifications
-- Created: 2025-12-17
-- Description: Adds notification triggers for mockups and wireframes

-- ============================================================================
-- UPDATE ENTITY TYPE CONSTRAINT
-- ============================================================================

-- Drop the old constraint
ALTER TABLE public.notifications
DROP CONSTRAINT IF EXISTS valid_entity_type;

-- Add new constraint with mockup and wireframe
ALTER TABLE public.notifications
ADD CONSTRAINT valid_entity_type CHECK (entity_type IN ('journey_map', 'persona', 'user_story', 'prototype', 'mockup', 'wireframe'));

-- ============================================================================
-- CREATE MOCKUP NOTIFICATION TRIGGER
-- ============================================================================

-- Create trigger function for mockups
CREATE OR REPLACE FUNCTION public.notify_mockup_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert notifications for all project members (excluding the creator)
  INSERT INTO public.notifications (user_id, creator_id, project_id, entity_type, entity_count, action, entity_id, entity_name)
  SELECT pm.user_id, NEW.creator_id, NEW.project_id, 'mockup', 1, 'created', NEW.id, NEW.title
  FROM public.project_members pm
  WHERE pm.project_id = NEW.project_id AND pm.user_id != NEW.creator_id;

  -- Insert notification for project owner if not already included
  INSERT INTO public.notifications (user_id, creator_id, project_id, entity_type, entity_count, action, entity_id, entity_name)
  SELECT p.user_id, NEW.creator_id, NEW.project_id, 'mockup', 1, 'created', NEW.id, NEW.title
  FROM public.projects p
  WHERE p.id = NEW.project_id AND p.user_id != NEW.creator_id
  AND NOT EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = NEW.project_id AND pm.user_id = p.user_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER mockup_notification_trigger
AFTER INSERT ON public.mockups
FOR EACH ROW
EXECUTE FUNCTION public.notify_mockup_created();

-- ============================================================================
-- CREATE WIREFRAME NOTIFICATION TRIGGER
-- ============================================================================

-- Create trigger function for wireframes
CREATE OR REPLACE FUNCTION public.notify_wireframe_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert notifications for all project members (excluding the creator)
  INSERT INTO public.notifications (user_id, creator_id, project_id, entity_type, entity_count, action, entity_id, entity_name)
  SELECT pm.user_id, NEW.user_id, NEW.project_id, 'wireframe', 1, 'created', NEW.id, NEW.title
  FROM public.project_members pm
  WHERE pm.project_id = NEW.project_id AND pm.user_id != NEW.user_id;

  -- Insert notification for project owner if not already included
  INSERT INTO public.notifications (user_id, creator_id, project_id, entity_type, entity_count, action, entity_id, entity_name)
  SELECT p.user_id, NEW.user_id, NEW.project_id, 'wireframe', 1, 'created', NEW.id, NEW.title
  FROM public.projects p
  WHERE p.id = NEW.project_id AND p.user_id != NEW.user_id
  AND NOT EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = NEW.project_id AND pm.user_id = p.user_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER wireframe_notification_trigger
AFTER INSERT ON public.wireframes
FOR EACH ROW
EXECUTE FUNCTION public.notify_wireframe_created();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION public.notify_mockup_created() IS 'Creates notifications when a mockup is added to a project';
COMMENT ON FUNCTION public.notify_wireframe_created() IS 'Creates notifications when a wireframe is added to a project';
