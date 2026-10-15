-- Migration Rollback: Remove mockup and wireframe notifications
-- Created: 2025-12-17
-- Description: Rollback for mockup and wireframe notification triggers

-- ============================================================================
-- DROP WIREFRAME TRIGGER
-- ============================================================================

DROP TRIGGER IF EXISTS wireframe_notification_trigger ON public.wireframes;
DROP FUNCTION IF EXISTS public.notify_wireframe_created();

-- ============================================================================
-- DROP MOCKUP TRIGGER
-- ============================================================================

DROP TRIGGER IF EXISTS mockup_notification_trigger ON public.mockups;
DROP FUNCTION IF EXISTS public.notify_mockup_created();

-- ============================================================================
-- RESTORE ORIGINAL ENTITY TYPE CONSTRAINT
-- ============================================================================

-- Drop the expanded constraint
ALTER TABLE public.notifications
DROP CONSTRAINT IF EXISTS valid_entity_type;

-- Restore original constraint (without mockup and wireframe)
ALTER TABLE public.notifications
ADD CONSTRAINT valid_entity_type CHECK (entity_type IN ('journey_map', 'persona', 'user_story', 'prototype'));
