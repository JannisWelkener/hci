-- Migration Rollback: Revert to restrictive profile viewing
-- Created: 2025-12-17
-- Description: Rollback to original policy where users can only view their own profile

-- ============================================================================
-- ROLLBACK TO ORIGINAL POLICY
-- ============================================================================

-- Drop the permissive policy
DROP POLICY IF EXISTS "Users can view profiles of project members" ON public.profiles;

-- Restore original restrictive policy
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);
