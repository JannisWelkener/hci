# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-12-08-team-invitation-system/spec.md

## Existing Tables (Reference)

### `project_members` Table
Already exists in migration `20251007008_enhance_projects_for_collaboration.sql`:

```sql
CREATE TABLE public.project_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_role CHECK (role IN ('owner', 'editor', 'viewer', 'member')),
  CONSTRAINT unique_project_user UNIQUE (project_id, user_id)
);
```

**Integration Point**: When invitations are accepted, new records are inserted into this table.

### `profiles` Table
Already exists in migration `20251005_create_profiles_table.sql`:

```sql
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'instructor')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Integration Point**: Used to look up existing users by email before sending invitations.

## New Table: `project_invitations`

This table tracks all project invitations sent via email, including their status and expiration.

```sql
CREATE TABLE public.project_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '14 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_invitation_status CHECK (
    status IN ('pending', 'accepted', 'declined', 'expired', 'revoked')
  ),
  CONSTRAINT valid_invitation_role CHECK (
    role IN ('owner', 'editor', 'viewer', 'member')
  )
);

-- Comment for documentation
COMMENT ON TABLE public.project_invitations IS 'Tracks email invitations sent to potential project collaborators';
COMMENT ON COLUMN public.project_invitations.token IS 'Unique cryptographic token used in invitation acceptance URL';
COMMENT ON COLUMN public.project_invitations.expires_at IS 'Invitation expiration timestamp (14 days from creation)';
```

### Column Descriptions

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key, auto-generated |
| `project_id` | UUID | Foreign key to projects table, cascades on delete |
| `inviter_id` | UUID | User who sent the invitation, references auth.users |
| `email` | TEXT | Email address of invitee (stored as-is, case-insensitive matching) |
| `token` | TEXT | Unique cryptographic token for invitation URL (UUID v4 format) |
| `status` | TEXT | Current invitation status (pending/accepted/declined/expired/revoked) |
| `role` | VARCHAR(50) | Role to assign upon acceptance (defaults to 'member') |
| `invited_at` | TIMESTAMPTZ | Timestamp when invitation was created |
| `expires_at` | TIMESTAMPTZ | Expiration timestamp (14 days from creation) |
| `accepted_at` | TIMESTAMPTZ | Timestamp when invitation was accepted (null if pending) |
| `created_at` | TIMESTAMPTZ | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | Record last update timestamp |

### Indexes

Create indexes for optimal query performance:

```sql
-- Index for finding invitations by project (used in team management UI)
CREATE INDEX idx_project_invitations_project_id
ON public.project_invitations(project_id);

-- Index for finding invitations by email (check for duplicates, case-insensitive)
CREATE INDEX idx_project_invitations_email
ON public.project_invitations(LOWER(email));

-- Index for token lookups (used in acceptance flow)
CREATE INDEX idx_project_invitations_token
ON public.project_invitations(token);

-- Index for status filtering (find pending invitations)
CREATE INDEX idx_project_invitations_status
ON public.project_invitations(status);

-- Composite index for pending invitations by project (most common query)
CREATE INDEX idx_project_invitations_project_status
ON public.project_invitations(project_id, status)
WHERE status = 'pending';
```

### Row-Level Security (RLS) Policies

Enable RLS and create policies for secure access:

```sql
-- Enable RLS
ALTER TABLE public.project_invitations ENABLE ROW LEVEL SECURITY;

-- Policy 1: Project owners can view invitations for their projects
CREATE POLICY "Project owners can view invitations"
ON public.project_invitations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_invitations.project_id
    AND projects.user_id = auth.uid()
  )
);

-- Policy 2: Project owners can create invitations
CREATE POLICY "Project owners can create invitations"
ON public.project_invitations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_invitations.project_id
    AND projects.user_id = auth.uid()
  )
);

-- Policy 3: Project owners can update invitations (for status changes like revocation)
CREATE POLICY "Project owners can update invitations"
ON public.project_invitations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_invitations.project_id
    AND projects.user_id = auth.uid()
  )
);

-- Policy 4: Project owners can delete invitations
CREATE POLICY "Project owners can delete invitations"
ON public.project_invitations
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_invitations.project_id
    AND projects.user_id = auth.uid()
  )
);
```

### Trigger: Update `updated_at` Timestamp

Reuse existing `handle_updated_at()` function from the projects table:

```sql
-- Trigger to automatically update updated_at timestamp
CREATE TRIGGER set_project_invitations_updated_at
  BEFORE UPDATE ON public.project_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
```

### Function: Validate and Accept Invitation

Database function to handle invitation acceptance logic atomically:

```sql
CREATE OR REPLACE FUNCTION accept_project_invitation(
  p_token TEXT,
  p_user_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  project_id UUID
) AS $$
DECLARE
  v_invitation public.project_invitations;
  v_existing_member UUID;
BEGIN
  -- Find the invitation by token
  SELECT * INTO v_invitation
  FROM public.project_invitations
  WHERE token = p_token
  LIMIT 1;

  -- Check if invitation exists
  IF v_invitation.id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Invitation not found'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Check if already accepted
  IF v_invitation.status = 'accepted' THEN
    RETURN QUERY SELECT FALSE, 'Invitation already accepted'::TEXT, v_invitation.project_id;
    RETURN;
  END IF;

  -- Check if expired
  IF v_invitation.expires_at < NOW() OR v_invitation.status = 'expired' THEN
    RETURN QUERY SELECT FALSE, 'Invitation has expired'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Check if revoked
  IF v_invitation.status = 'revoked' THEN
    RETURN QUERY SELECT FALSE, 'Invitation has been revoked'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Check if declined
  IF v_invitation.status = 'declined' THEN
    RETURN QUERY SELECT FALSE, 'Invitation was declined'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Check if user is already a member
  SELECT id INTO v_existing_member
  FROM public.project_members
  WHERE project_id = v_invitation.project_id
    AND user_id = p_user_id
  LIMIT 1;

  IF v_existing_member IS NOT NULL THEN
    -- User already member, just mark invitation as accepted
    UPDATE public.project_invitations
    SET status = 'accepted',
        accepted_at = NOW(),
        updated_at = NOW()
    WHERE id = v_invitation.id;

    RETURN QUERY SELECT TRUE, 'Already a member of this project'::TEXT, v_invitation.project_id;
    RETURN;
  END IF;

  -- Add user to project_members
  INSERT INTO public.project_members (project_id, user_id, role)
  VALUES (v_invitation.project_id, p_user_id, v_invitation.role);

  -- Update invitation status
  UPDATE public.project_invitations
  SET status = 'accepted',
      accepted_at = NOW(),
      updated_at = NOW()
  WHERE id = v_invitation.id;

  RETURN QUERY SELECT TRUE, 'Invitation accepted successfully'::TEXT, v_invitation.project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION accept_project_invitation IS 'Atomically accepts a project invitation and adds user to project_members';
```

### Function: Mark Expired Invitations (Optional Cleanup)

Utility function to mark expired invitations (can be called via cron or manually):

```sql
CREATE OR REPLACE FUNCTION mark_expired_invitations()
RETURNS INTEGER AS $$
DECLARE
  affected_count INTEGER;
BEGIN
  UPDATE public.project_invitations
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'pending'
    AND expires_at <= NOW();

  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RETURN affected_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION mark_expired_invitations IS 'Marks all expired pending invitations. Returns count of updated rows.';
```

## Migration File

Create migration file: `supabase/migrations/20251208001_add_project_invitations.sql`

```sql
-- Migration: Add project invitations system
-- Date: 2025-12-08
-- Description: Creates project_invitations table for email-based team invitations

BEGIN;

-- ============================================================================
-- 1. Create project_invitations table
-- ============================================================================

CREATE TABLE public.project_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '14 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_invitation_status CHECK (
    status IN ('pending', 'accepted', 'declined', 'expired', 'revoked')
  ),
  CONSTRAINT valid_invitation_role CHECK (
    role IN ('owner', 'editor', 'viewer', 'member')
  )
);

-- Add table and column comments
COMMENT ON TABLE public.project_invitations IS 'Tracks email invitations sent to potential project collaborators';
COMMENT ON COLUMN public.project_invitations.token IS 'Unique cryptographic token used in invitation acceptance URL';
COMMENT ON COLUMN public.project_invitations.expires_at IS 'Invitation expiration timestamp (14 days from creation)';

-- ============================================================================
-- 2. Create indexes
-- ============================================================================

CREATE INDEX idx_project_invitations_project_id
ON public.project_invitations(project_id);

CREATE INDEX idx_project_invitations_email
ON public.project_invitations(LOWER(email));

CREATE INDEX idx_project_invitations_token
ON public.project_invitations(token);

CREATE INDEX idx_project_invitations_status
ON public.project_invitations(status);

CREATE INDEX idx_project_invitations_project_status
ON public.project_invitations(project_id, status)
WHERE status = 'pending';

-- ============================================================================
-- 3. Enable Row Level Security
-- ============================================================================

ALTER TABLE public.project_invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Project owners can view invitations
CREATE POLICY "Project owners can view invitations"
ON public.project_invitations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_invitations.project_id
    AND projects.user_id = auth.uid()
  )
);

-- Policy: Project owners can create invitations
CREATE POLICY "Project owners can create invitations"
ON public.project_invitations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_invitations.project_id
    AND projects.user_id = auth.uid()
  )
);

-- Policy: Project owners can update invitations
CREATE POLICY "Project owners can update invitations"
ON public.project_invitations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_invitations.project_id
    AND projects.user_id = auth.uid()
  )
);

-- Policy: Project owners can delete invitations
CREATE POLICY "Project owners can delete invitations"
ON public.project_invitations
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_invitations.project_id
    AND projects.user_id = auth.uid()
  )
);

-- ============================================================================
-- 4. Create triggers
-- ============================================================================

-- Reuse existing handle_updated_at() function
CREATE TRIGGER set_project_invitations_updated_at
  BEFORE UPDATE ON public.project_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 5. Create utility functions
-- ============================================================================

-- Function to accept invitations atomically
CREATE OR REPLACE FUNCTION accept_project_invitation(
  p_token TEXT,
  p_user_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  project_id UUID
) AS $$
DECLARE
  v_invitation public.project_invitations;
  v_existing_member UUID;
BEGIN
  SELECT * INTO v_invitation
  FROM public.project_invitations
  WHERE token = p_token
  LIMIT 1;

  IF v_invitation.id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Invitation not found'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  IF v_invitation.status = 'accepted' THEN
    RETURN QUERY SELECT FALSE, 'Invitation already accepted'::TEXT, v_invitation.project_id;
    RETURN;
  END IF;

  IF v_invitation.expires_at < NOW() OR v_invitation.status = 'expired' THEN
    RETURN QUERY SELECT FALSE, 'Invitation has expired'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  IF v_invitation.status = 'revoked' THEN
    RETURN QUERY SELECT FALSE, 'Invitation has been revoked'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  IF v_invitation.status = 'declined' THEN
    RETURN QUERY SELECT FALSE, 'Invitation was declined'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  SELECT id INTO v_existing_member
  FROM public.project_members
  WHERE project_id = v_invitation.project_id
    AND user_id = p_user_id
  LIMIT 1;

  IF v_existing_member IS NOT NULL THEN
    UPDATE public.project_invitations
    SET status = 'accepted',
        accepted_at = NOW(),
        updated_at = NOW()
    WHERE id = v_invitation.id;

    RETURN QUERY SELECT TRUE, 'Already a member of this project'::TEXT, v_invitation.project_id;
    RETURN;
  END IF;

  INSERT INTO public.project_members (project_id, user_id, role)
  VALUES (v_invitation.project_id, p_user_id, v_invitation.role);

  UPDATE public.project_invitations
  SET status = 'accepted',
      accepted_at = NOW(),
      updated_at = NOW()
  WHERE id = v_invitation.id;

  RETURN QUERY SELECT TRUE, 'Invitation accepted successfully'::TEXT, v_invitation.project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION accept_project_invitation IS 'Atomically accepts a project invitation and adds user to project_members';

-- Function to mark expired invitations
CREATE OR REPLACE FUNCTION mark_expired_invitations()
RETURNS INTEGER AS $$
DECLARE
  affected_count INTEGER;
BEGIN
  UPDATE public.project_invitations
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'pending'
    AND expires_at <= NOW();

  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RETURN affected_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION mark_expired_invitations IS 'Marks all expired pending invitations. Returns count of updated rows.';

COMMIT;
```

## Rollback Migration

Create rollback file: `supabase/migrations/20251208002_rollback_project_invitations.sql`

```sql
-- Rollback Migration: Remove project invitations system
-- Date: 2025-12-08

BEGIN;

-- Drop functions
DROP FUNCTION IF EXISTS accept_project_invitation(TEXT, UUID);
DROP FUNCTION IF EXISTS mark_expired_invitations();

-- Drop table (cascade will remove policies, triggers, and indexes)
DROP TABLE IF EXISTS public.project_invitations CASCADE;

COMMIT;
```

## Integration with Existing Schema

### Relationship Diagram

```
auth.users (Supabase Auth)
    ↓ (1:many)
public.profiles
    ↓
public.projects (user_id = owner)
    ↓ (1:many)
public.project_members ← NEW: Gets records when invitations accepted
    ↓
public.project_invitations ← NEW TABLE
```

### Key Integration Points

1. **Email Validation**: Before sending invitation, check `profiles.email` to see if user already exists
2. **Duplicate Prevention**: Check for existing `project_members` record before allowing invitation
3. **Role Consistency**: Use same role values as `project_members` table
4. **Automatic Cleanup**: When project is deleted, invitations cascade delete (ON DELETE CASCADE)
5. **Member Addition**: Invitation acceptance creates `project_members` record automatically via `accept_project_invitation()` function

## Rationale

### Why No Unique Constraint on (project_id, email)?

We allow multiple invitations to the same email for the same project over time (e.g., if first invitation expired, can send another). However, we prevent duplicate *pending* invitations via application logic (not database constraint).

### Why Separate Status for Expired vs Revoked?

- **Expired**: Natural timeout after 14 days - user still had the chance
- **Revoked**: Explicit owner action - invitation was cancelled
- Different user feedback messages for each scenario

### Why SECURITY DEFINER on Functions?

The `accept_project_invitation` function needs to bypass RLS policies to insert into `project_members` table even when the accepting user doesn't own the project. This is safe because the function validates the invitation token first.

### Why Case-Insensitive Email Index?

Email addresses are case-insensitive (user@example.com = USER@EXAMPLE.COM). The `LOWER(email)` index enables efficient case-insensitive lookups and duplicate detection.

## Data Integrity Rules

1. **No duplicate pending invitations**: Application logic prevents sending multiple pending invitations to same email for same project
2. **Automatic expiration**: Invitations expire 14 days after creation (`expires_at` column)
3. **Immutable tokens**: Once created, invitation tokens never change
4. **Status transitions**: Valid state machine:
   - `pending` → `accepted` | `declined` | `expired` | `revoked`
   - Terminal states: `accepted`, `declined`, `expired`, `revoked` (no further transitions)
5. **Role consistency**: Invitation roles must match `project_members.valid_role` constraint
6. **Cascade deletion**: Invitations deleted when project or inviter is deleted
