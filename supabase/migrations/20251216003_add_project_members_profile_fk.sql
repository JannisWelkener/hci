-- Migration: Add foreign key relationship between project_members and profiles
-- Date: 2025-12-16
-- Description: Adds a foreign key constraint to enable Supabase joins

-- Add foreign key constraint from project_members.user_id to profiles.id
-- This enables Supabase to automatically join project_members with profiles
-- Note: profiles.id is the same as auth.users.id, so this is safe
ALTER TABLE public.project_members
ADD CONSTRAINT fk_project_members_profile
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- Add comment
COMMENT ON CONSTRAINT fk_project_members_profile ON public.project_members IS 'Foreign key to profiles for automatic joins';
