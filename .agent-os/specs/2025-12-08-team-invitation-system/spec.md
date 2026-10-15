# Spec Requirements Document

> Spec: Team Invitation System
> Created: 2025-12-08

## Overview

Implement a team invitation system that allows project owners to invite collaborators via email, enabling seamless team onboarding for HCI Hub projects. This feature will support inviting both existing users and new users (who must create accounts to accept), with email notifications powered by Resend.

## User Stories

### Inviting Team Members

As a project owner, I want to invite collaborators to my project via email, so that I can build my team even if they don't have HCI Hub accounts yet.

**Workflow:**
1. Project owner navigates to project team management page (`/projects/[id]/team`)
2. Owner clicks "Invite Member" and enters collaborator's email address
3. Owner optionally selects a role (currently defaults to 'member', with roles like viewer/editor reserved for future implementation)
4. System validates the email and sends invitation via Resend
5. Invitee receives a simple email: "[Inviter Name] wants to invite you to [Project Name]" with an "Accept Invitation" link
6. Invitation remains valid for 14 days
7. Project owner can view pending invitations and revoke them if needed

### Accepting Invitations (New Users)

As someone invited to a project, I want to accept the invitation and create an account, so that I can join the project team.

**Workflow:**
1. Invitee clicks "Accept Invitation" link in email
2. System checks if user has an account (via email lookup)
3. If no account exists, user is redirected to registration page with invitation context preserved
4. After successful registration, user is automatically added to the project
5. User is redirected to the project dashboard

### Accepting Invitations (Existing Users)

As an existing HCI Hub user, I want to accept project invitations, so that I can collaborate on new projects.

**Workflow:**
1. Invitee clicks "Accept Invitation" link in email
2. System recognizes existing account
3. If not logged in, user is redirected to login page with invitation context preserved
4. After authentication, user is automatically added to the project
5. User is redirected to the project dashboard with success notification

### Managing Pending Invitations

As a project owner, I want to view and manage pending invitations, so that I can track who I've invited and revoke invitations if needed.

**Workflow:**
1. Project owner visits team management page (`/projects/[id]/team`)
2. Owner sees a "Pending Invitations" section listing all active invitations
3. Each invitation shows: invitee email, invited by, date sent, expiration date, status
4. Owner can click "Revoke" to cancel an invitation
5. Revoked invitations become invalid and acceptance links no longer work

## Spec Scope

1. **Email Invitation System** - Send project invitations via Resend with minimal email template containing inviter name, project name, and acceptance link
2. **Invitation Database Schema** - Create `project_invitations` table to track pending, accepted, declined, expired, and revoked invitations with 14-day expiration
3. **Invitation Acceptance Flow** - Handle invitation acceptance for both new users (registration flow) and existing users (authentication flow) with automatic project membership
4. **Team Management UI** - Add team management page at `/projects/[id]/team` with invitation sending, pending invitations list, and revocation functionality
5. **API Endpoints** - Implement RESTful endpoints for creating invitations, accepting/declining invitations, listing invitations, and revoking invitations

## Out of Scope

- **Role-based permissions** - All invited users will be added as 'member' role; granular permissions (viewer, editor) are reserved for future implementation
- **In-app notifications** - Email-only notifications for this iteration; in-app notification system deferred to future phase
- **Bulk invitations** - One invitation at a time; batch invitation feature not included
- **Custom email templates** - Minimal text-only email template; branded HTML templates deferred
- **Invitation history** - No tracking of accepted/declined invitation history beyond current status
- **Invitation reminders** - No automatic reminder emails for pending invitations

## Expected Deliverable

1. **Functional invitation flow** - Project owners can send email invitations via Resend, and invitees can accept to join projects (testable by sending invitation, receiving email, and accepting via link)
2. **Team management interface** - Accessible team page at `/projects/[projectId]/team` displaying current members, pending invitations, and ability to invite/revoke (testable by navigating to any owned project's team page)
3. **Complete acceptance workflow** - Both new users (via registration) and existing users (via login) can successfully accept invitations and become project members (testable by accepting invitation with new email and with existing account)
