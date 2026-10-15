-- Migration Rollback: Remove notifications table
-- Created: 2025-12-17
-- Description: Rollback script to remove notifications functionality

-- ============================================================================
-- DROP TRIGGER AND FUNCTION
-- ============================================================================

-- Drop trigger for journey maps
DROP TRIGGER IF EXISTS journey_map_notification_trigger ON public.user_journey_maps;

-- Drop trigger function
DROP FUNCTION IF EXISTS public.notify_project_members_journey_map();

-- ============================================================================
-- DROP TABLE
-- ============================================================================

-- Drop notifications table (CASCADE will drop all related objects)
DROP TABLE IF EXISTS public.notifications CASCADE;
