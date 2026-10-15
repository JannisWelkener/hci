-- Migration: Add read status to notifications
-- Created: 2025-12-17
-- Description: Adds 'read' column to track if user has viewed the notification

-- ============================================================================
-- ADD READ COLUMN
-- ============================================================================

-- Add read column (defaults to false for new notifications)
ALTER TABLE public.notifications
ADD COLUMN read BOOLEAN NOT NULL DEFAULT false;

-- Create index for efficient querying of unread notifications
CREATE INDEX idx_notifications_user_id_read_created_at
ON public.notifications(user_id, read, created_at DESC);

-- ============================================================================
-- UPDATE RLS POLICY TO ALLOW USERS TO MARK THEIR OWN NOTIFICATIONS AS READ
-- ============================================================================

-- Allow users to update the 'read' status of their own notifications
CREATE POLICY "Users can update own notifications read status"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN public.notifications.read IS 'Whether the user has viewed this notification';
COMMENT ON POLICY "Users can update own notifications read status" ON public.notifications IS 'Allows users to mark their own notifications as read';
