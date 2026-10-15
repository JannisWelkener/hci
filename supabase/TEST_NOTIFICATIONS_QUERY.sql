-- Test notifications query step by step
-- Run this in Supabase SQL Editor while logged in

-- ============================================================================
-- TEST 1: Basic query without joins
-- ============================================================================
-- This should work even without migration 010
SELECT
  id,
  user_id,
  creator_id,
  project_id,
  entity_type,
  entity_count,
  action,
  created_at
FROM public.notifications
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 10;

-- Expected: Should return your notifications WITHOUT creator/project names
-- If this fails: RLS policy on notifications table is blocking

-- ============================================================================
-- TEST 2: Join with profiles (requires migration 010)
-- ============================================================================
-- This will FAIL if migration 010 is not applied
SELECT
  n.id,
  n.user_id,
  n.creator_id,
  n.project_id,
  n.entity_type,
  n.entity_count,
  n.action,
  n.created_at,
  creator.full_name as creator_name
FROM public.notifications n
LEFT JOIN public.profiles creator ON creator.id = n.creator_id
WHERE n.user_id = auth.uid()
ORDER BY n.created_at DESC
LIMIT 10;

-- Expected (if migration 010 applied): Should return notifications WITH creator names
-- If this fails: Migration 010 not applied or profiles RLS still blocking

-- ============================================================================
-- TEST 3: Full query with profiles AND projects
-- ============================================================================
-- This is what the actual hook uses
SELECT
  n.id,
  n.user_id,
  n.creator_id,
  n.project_id,
  n.entity_type,
  n.entity_count,
  n.action,
  n.created_at,
  creator.full_name as creator_name,
  project.name as project_name
FROM public.notifications n
LEFT JOIN public.profiles creator ON creator.id = n.creator_id
LEFT JOIN public.projects project ON project.id = n.project_id
WHERE n.user_id = auth.uid()
ORDER BY n.created_at DESC
LIMIT 10;

-- Expected (if everything working): Should return notifications WITH creator names AND project names
-- If this fails: Check RLS on profiles or projects table
