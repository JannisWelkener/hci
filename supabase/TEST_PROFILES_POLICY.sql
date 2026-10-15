-- Test if the new profiles RLS policy is active
-- Run this in Supabase SQL Editor while logged in as a user

-- 1. Check what policies exist on profiles table
SELECT
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles';

-- Expected result:
-- You should see "Users can view profiles of project members" (new policy)
-- You should NOT see "Users can view own profile" (old restrictive policy)

-- 2. Test if you can view other users' profiles in your projects
-- (Replace YOUR_USER_ID with your actual user ID from auth.users)
SELECT
  p.id,
  p.full_name,
  p.email,
  'Can view this profile!' as status
FROM profiles p
WHERE p.id != auth.uid()  -- Other users
LIMIT 5;

-- If migration 010 is applied correctly:
-- - You should see other users' profiles (people in your projects)
-- If migration 010 is NOT applied:
-- - You will see no results (RLS blocks viewing other profiles)
