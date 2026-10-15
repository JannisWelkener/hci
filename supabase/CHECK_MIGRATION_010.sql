-- ============================================================================
-- CHECK IF MIGRATION 010 WAS APPLIED CORRECTLY
-- ============================================================================
-- Run this in Supabase SQL Editor

-- 1. Check ALL policies on profiles table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles';

-- EXPECTED RESULT:
-- You should see ONLY ONE policy: "Users can view profiles of project members"
-- You should NOT see "Users can view own profile"

-- If you see BOTH policies, migration 010 didn't drop the old one properly
-- If you see ZERO policies, migration 010 wasn't run
-- If you see only the old policy, migration 010 wasn't run


-- ============================================================================
-- 2. Try to view another user's profile (tests if policy works)
-- ============================================================================
SELECT
  id,
  full_name,
  email,
  'SUCCESS: Can view this user' as status
FROM public.profiles
WHERE id != auth.uid()
LIMIT 3;

-- EXPECTED RESULT (if migration 010 applied correctly):
-- You should see profiles of users in your projects

-- EXPECTED RESULT (if migration 010 NOT applied):
-- Empty result (RLS blocks viewing other profiles)
