-- Migration Rollback: Remove read status from notifications
-- Created: 2025-12-17
-- Description: Rollback for adding read column to notifications table

-- ============================================================================
-- DROP RLS POLICY
-- ============================================================================

DROP POLICY IF EXISTS "Users can update own notifications read status" ON public.notifications;

-- ============================================================================
-- DROP INDEX
-- ============================================================================

DROP INDEX IF EXISTS idx_notifications_user_id_read_created_at;

-- ============================================================================
-- REMOVE READ COLUMN
-- ============================================================================

ALTER TABLE public.notifications
DROP COLUMN IF EXISTS read;
