-- Migration: Add notifications table
-- Created: 2025-12-17
-- Description: Creates notifications table for tracking project activity with RLS policies and triggers

-- ============================================================================
-- NOTIFICATIONS TABLE
-- ============================================================================

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL,
  entity_count INTEGER NOT NULL DEFAULT 1,
  action VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_entity_type CHECK (entity_type IN ('journey_map', 'persona', 'user_story', 'prototype')),
  CONSTRAINT valid_action CHECK (action IN ('created', 'updated', 'deleted')),
  CONSTRAINT positive_count CHECK (entity_count > 0)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for fetching user's notifications efficiently (newest first)
CREATE INDEX idx_notifications_user_id_created_at
ON public.notifications(user_id, created_at DESC);

-- Index for filtering by project
CREATE INDEX idx_notifications_project_id
ON public.notifications(project_id);

-- Index for creator filtering (to exclude own changes from badge count)
CREATE INDEX idx_notifications_creator_id
ON public.notifications(creator_id);

-- Composite index for common query pattern (user's notifications excluding own)
CREATE INDEX idx_notifications_user_creator_project
ON public.notifications(user_id, creator_id, project_id, created_at DESC);

-- ============================================================================
-- ROW-LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only view notifications where they are the recipient
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

-- Allow system to insert notifications (any authenticated user can create)
-- This is used by triggers to generate notifications for all project members
CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Prevent users from deleting or updating notifications
-- (Future: may allow marking as read)

-- ============================================================================
-- TRIGGER FUNCTION TO AUTO-GENERATE NOTIFICATIONS
-- ============================================================================

-- Function to create notifications for all project members when a journey map is created
CREATE OR REPLACE FUNCTION public.notify_project_members_journey_map()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert one notification per project member (excluding the creator)
  INSERT INTO public.notifications (user_id, creator_id, project_id, entity_type, entity_count, action)
  SELECT
    pm.user_id,
    NEW.created_by,
    NEW.project_id,
    'journey_map',
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
    'journey_map',
    1,
    'created'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for user_journey_maps table
CREATE TRIGGER journey_map_notification_trigger
AFTER INSERT ON public.user_journey_maps
FOR EACH ROW
EXECUTE FUNCTION public.notify_project_members_journey_map();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.notifications IS 'Notifications for project activity tracking (Journey Maps, Personas, etc.)';
COMMENT ON COLUMN public.notifications.user_id IS 'The recipient user who will see this notification (project member)';
COMMENT ON COLUMN public.notifications.creator_id IS 'The user who performed the action (created the entity)';
COMMENT ON COLUMN public.notifications.project_id IS 'The project where the change occurred';
COMMENT ON COLUMN public.notifications.entity_type IS 'Type of entity changed (journey_map, persona, user_story, prototype)';
COMMENT ON COLUMN public.notifications.entity_count IS 'Number of entities affected in this notification (e.g., 3 Journey Maps created)';
COMMENT ON COLUMN public.notifications.action IS 'The action performed (created, updated, deleted)';
