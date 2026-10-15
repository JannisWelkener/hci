-- Migration Rollback: Remove persona notifications trigger
-- Created: 2025-12-17
-- Description: Rollback script to remove persona notification trigger

-- ============================================================================
-- DROP TRIGGER AND FUNCTION
-- ============================================================================

-- Drop trigger for personas
DROP TRIGGER IF EXISTS persona_notification_trigger ON public.personas;

-- Drop trigger function
DROP FUNCTION IF EXISTS public.notify_project_members_persona();
