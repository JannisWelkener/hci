-- Migration: Add project_invitations table for team collaboration
-- Date: 2025-12-16
-- Description: Creates project_invitations table with RLS policies and helper function

-- ============================================================================
-- 1. Create project_invitations table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.project_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  invitee_email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  token VARCHAR(255) NOT NULL UNIQUE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_invitation_role CHECK (role IN ('owner', 'editor', 'viewer', 'member')),
  CONSTRAINT valid_invitation_status CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'revoked')),
  CONSTRAINT unique_pending_invitation UNIQUE (project_id, invitee_email, status)
);

-- Add indexes for performance
CREATE INDEX idx_project_invitations_project_id ON public.project_invitations(project_id);
CREATE INDEX idx_project_invitations_token ON public.project_invitations(token);
CREATE INDEX idx_project_invitations_status ON public.project_invitations(status);
CREATE INDEX idx_project_invitations_invitee_email ON public.project_invitations(invitee_email);
CREATE INDEX idx_project_invitations_invited_by ON public.project_invitations(invited_by);

-- Add comments for documentation
COMMENT ON TABLE public.project_invitations IS 'Manages project invitations for team collaboration';
COMMENT ON COLUMN public.project_invitations.invitee_email IS 'Email address of the invited user';
COMMENT ON COLUMN public.project_invitations.role IS 'Role to be assigned: owner, editor, viewer, or member';
COMMENT ON COLUMN public.project_invitations.status IS 'Invitation status: pending, accepted, declined, expired, or revoked';
COMMENT ON COLUMN public.project_invitations.token IS 'Unique token for invitation acceptance URL';
COMMENT ON COLUMN public.project_invitations.expires_at IS 'Expiration timestamp (typically 14 days from creation)';

-- ============================================================================
-- 2. Create trigger for updated_at
-- ============================================================================

CREATE TRIGGER set_project_invitations_updated_at
  BEFORE UPDATE ON public.project_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 3. Row Level Security for project_invitations
-- ============================================================================

-- Enable RLS
ALTER TABLE public.project_invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view invitations for projects they have access to
CREATE POLICY "Users can view project invitations"
ON public.project_invitations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_invitations.project_id
    AND (
      projects.user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.project_members pm
        WHERE pm.project_id = projects.id
        AND pm.user_id = auth.uid()
      )
    )
  )
);

-- Policy: Project owners and admins can create invitations
CREATE POLICY "Project owners and admins can create invitations"
ON public.project_invitations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_invitations.project_id
    AND (
      projects.user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.project_members pm
        WHERE pm.project_id = projects.id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('owner', 'editor')
      )
    )
  )
  AND invited_by = auth.uid()
);

-- Policy: Project owners, admins, and inviters can update invitations
CREATE POLICY "Users can update project invitations"
ON public.project_invitations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_invitations.project_id
    AND (
      projects.user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.project_members pm
        WHERE pm.project_id = projects.id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('owner', 'editor')
      )
    )
  )
  OR invited_by = auth.uid()
);

-- Policy: Project owners, admins, and inviters can delete/revoke invitations
CREATE POLICY "Users can delete project invitations"
ON public.project_invitations
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_invitations.project_id
    AND (
      projects.user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.project_members pm
        WHERE pm.project_id = projects.id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('owner', 'editor')
      )
    )
  )
  OR invited_by = auth.uid()
);

-- ============================================================================
-- 4. Helper function to accept project invitation atomically
-- ============================================================================

CREATE OR REPLACE FUNCTION public.accept_project_invitation(
  p_token TEXT,
  p_user_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  project_id UUID
) AS $$
DECLARE
  v_invitation RECORD;
  v_role VARCHAR(50);
BEGIN
  -- Get invitation details
  SELECT * INTO v_invitation
  FROM public.project_invitations
  WHERE token = p_token
  AND status = 'pending'
  FOR UPDATE;

  -- Check if invitation exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Invitation not found or already processed'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Check if invitation has expired
  IF v_invitation.expires_at < NOW() THEN
    -- Update status to expired
    UPDATE public.project_invitations
    SET status = 'expired', updated_at = NOW()
    WHERE id = v_invitation.id;

    RETURN QUERY SELECT FALSE, 'Invitation has expired'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Check if user is already a member
  IF EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = v_invitation.project_id
    AND user_id = p_user_id
  ) THEN
    -- Update invitation status to accepted
    UPDATE public.project_invitations
    SET status = 'accepted', updated_at = NOW()
    WHERE id = v_invitation.id;

    RETURN QUERY SELECT TRUE, 'You are already a member of this project'::TEXT, v_invitation.project_id;
    RETURN;
  END IF;

  -- Add user as project member
  INSERT INTO public.project_members (project_id, user_id, role)
  VALUES (v_invitation.project_id, p_user_id, v_invitation.role);

  -- Update invitation status to accepted
  UPDATE public.project_invitations
  SET status = 'accepted', updated_at = NOW()
  WHERE id = v_invitation.id;

  RETURN QUERY SELECT TRUE, 'Successfully joined project'::TEXT, v_invitation.project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment for documentation
COMMENT ON FUNCTION public.accept_project_invitation IS 'Atomically accepts a project invitation and adds user as member';
