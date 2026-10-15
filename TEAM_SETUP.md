# Team Collaboration Setup Instructions

This document provides instructions for setting up the team collaboration features in HCI Hub.

## Database Migrations

You need to run TWO database migrations to enable team collaboration features.

### Option 1: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the following migrations in order:

**Migration 1: Add project_invitations table**
- Copy the contents of `supabase/migrations/20251216001_add_project_invitations.sql`
- Paste and execute the SQL in the editor

**Migration 2: Add profile foreign key**
- Copy the contents of `supabase/migrations/20251216003_add_project_members_profile_fk.sql`
- Paste and execute the SQL in the editor

### Option 2: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
supabase db push
```

This will run all pending migrations automatically.

Or run the specific migrations:

```bash
supabase migration up --db-url "your-database-url"
```

## Environment Variables

Make sure you have the following environment variables set in your `.env.local` file:

```env
# Lettermint API Token for sending invitation emails
LETTERMINT_API_TOKEN=lm_l5H4VhLa6tqpNakcGtmTGyXlDPnZznaU

# Optional: Custom FROM email address (defaults to noreply@hcihub.com)
FROM_EMAIL=your_sender_email@yourdomain.com

# Application URL (used for invitation links)
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or your production URL
```

## Features Enabled

After running the migration and setting up environment variables, the following features will be available:

### Team Page (`/projects/[projectId]/team`)

- View all project members with their roles
- Invite new members by email
- Generate invite links for sharing
- Manage pending invitations
- Remove team members (owner only)

### Invitation System

- Email invitations sent via Lettermint
- Secure token-based invitation links
- 14-day expiration on invitations
- Accept/decline invitation workflow
- Automatic member addition on acceptance

### Roles

- **Owner**: Full control (auto-assigned to project creator)
- **Editor**: Can edit project and invite members
- **Viewer**: Read-only access
- **Member**: Standard collaboration access

## Migrations Details

### Migration 1: Project Invitations (20251216001)

Creates the invitation system:

1. **Table**: `project_invitations`
   - Stores invitation details and status
   - Tracks invited users by email
   - Includes role assignment
   - Manages invitation lifecycle (pending → accepted/declined/expired/revoked)

2. **Function**: `accept_project_invitation(token, user_id)`
   - Atomically processes invitation acceptance
   - Adds user to project_members
   - Updates invitation status

3. **RLS Policies**
   - Project owners and admins can create/manage invitations
   - Users can view invitations for projects they have access to
   - Inviters can revoke their own invitations

### Migration 2: Profile Foreign Key (20251216003)

Adds a foreign key relationship:

1. **Foreign Key**: `project_members.user_id` → `profiles.id`
   - Enables Supabase automatic joins
   - Fixes "Could not find relationship" error
   - Allows fetching member profiles efficiently

## API Endpoints

### Project Invitations

- `GET /api/projects/[id]/invitations?status=pending` - List invitations
- `POST /api/projects/[id]/invitations` - Create invitation
- `DELETE /api/projects/[id]/invitations/[invitationId]` - Revoke invitation

### Invitation Actions

- `GET /api/invitations/[token]` - Get invitation details
- `POST /api/invitations/[token]/accept` - Accept invitation
- `POST /api/invitations/[token]/decline` - Decline invitation

### Project Members

- `GET /api/projects/[id]/members` - List members
- `POST /api/projects/[id]/members` - Add member (requires user_id)
- `DELETE /api/projects/[id]/members/[userId]` - Remove member

## Troubleshooting

### "Failed to fetch project members" Error

This error occurs if the migration hasn't been run yet. Make sure to execute the migration as described above.

### "Failed to send invitation email" Warning

If email sending fails, the invitation is still created in the database. This is not a critical error - users can still accept invitations via the link. Check your Lettermint API token configuration.

### Invitation Not Found

- Check that the invitation hasn't expired (14 days limit)
- Verify the token in the URL is correct
- Ensure the invitation hasn't been revoked

## Rollback

If you need to rollback the migration:

```sql
-- Execute the contents of:
-- supabase/migrations/20251216002_rollback_project_invitations.sql
```

This will remove the `project_invitations` table and all related objects.
