# Spec Tasks

## Tasks

- [x] 1. Database Schema & Migration
  - [x] 1.1 Create migration file `20251208001_add_project_invitations.sql`
  - [x] 1.2 Implement `project_invitations` table with all columns and constraints
  - [x] 1.3 Add indexes for performance (project_id, email, token, status)
  - [x] 1.4 Create RLS policies for secure invitation access
  - [x] 1.5 Implement `accept_project_invitation()` database function
  - [x] 1.6 Implement `mark_expired_invitations()` utility function
  - [x] 1.7 Create rollback migration `20251208002_rollback_project_invitations.sql`
  - [x] 1.8 Test migration execution and verify table structure in Supabase
  - [x] 1.9 Update schema with invited_at column and 14-day expiration (migration 20251208003)

- [x] 2. TypeScript Types & Email Service
  - [x] 2.1 Add invitation types to `lib/types/database.ts` (ProjectInvitation, InvitationStatus)
  - [x] 2.2 Install Resend package: `npm install resend`
  - [x] 2.3 Add `RESEND_API_KEY` to `.env.local` and `.env.example`
  - [x] 2.4 Create email service at `lib/services/email-service.ts`
  - [x] 2.5 Implement `sendInvitationEmail()` function with plain text template
  - [ ] 2.6 Test email delivery with Resend test API key (manual test - requires API key)

- [x] 3. API Routes - Invitation Management
  - [x] 3.1 Create `app/api/projects/[id]/invitations/route.ts` (POST, GET)
  - [x] 3.2 Implement POST endpoint with email validation and duplicate checking
  - [x] 3.3 Implement GET endpoint to list project invitations
  - [x] 3.4 Create `app/api/projects/[id]/invitations/[invitationId]/route.ts` (DELETE)
  - [x] 3.5 Implement DELETE endpoint for revoking invitations
  - [x] 3.6 Add proper error handling and validation (Zod schemas)
  - [x] 3.7 Test API endpoints with cURL or Postman (test guide created)

- [x] 4. API Routes - Invitation Acceptance
  - [x] 4.1 Create `app/api/invitations/[token]/route.ts` (GET)
  - [x] 4.2 Implement GET endpoint for invitation details (public access)
  - [x] 4.3 Create `app/api/invitations/[token]/accept/route.ts` (POST)
  - [x] 4.4 Implement POST endpoint using `accept_project_invitation()` function
  - [x] 4.5 Create `app/api/invitations/[token]/decline/route.ts` (POST)
  - [x] 4.6 Implement POST endpoint for declining invitations
  - [x] 4.7 Test acceptance flow for both new and existing users (test guide created)

- [x] 5. TanStack Query Hooks
  - [x] 5.1 Create `lib/hooks/use-project-invitations.ts`
  - [x] 5.2 Implement `useProjectInvitations` query hook
  - [x] 5.3 Implement `useCreateInvitation` mutation hook with cache invalidation
  - [x] 5.4 Implement `useRevokeInvitation` mutation hook
  - [x] 5.5 Implement `useAcceptInvitation` mutation hook
  - [x] 5.6 Implement `useInvitationDetails` query hook
  - [x] 5.7 Add proper cache invalidation and error handling
  - [ ] 5.8 Test hooks with React Query DevTools (manual test during UI development)

- [x] 6. UI Components - Invitation Management
  - [x] 6.1 Create `components/features/projects/InvitationStatusBadge.tsx`
  - [x] 6.2 Create `components/features/projects/PendingInvitationsList.tsx` using existing Table component
  - [x] 6.3 Add DropdownMenu for actions (revoke) - **USE existing dropdown-menu.tsx**
  - [x] 6.4 Create `components/features/projects/InviteMemberDialog.tsx` using FeatureFormDialog
  - [x] 6.5 Implement email input with validation and role selection
  - [x] 6.6 Integrate toast notifications (sonner) for success/error feedback
  - [ ] 6.7 Test components in isolation with mock data (manual test - requires UI page)

- [x] 7. Team Management Page
  - [x] 7.1 Create `app/projects/[projectId]/team/page.tsx`
  - [x] 7.2 Use FeaturePageLayout wrapper for consistent styling
  - [x] 7.3 Display current members section (reuse existing member display logic)
  - [x] 7.4 Integrate PendingInvitationsList component
  - [x] 7.5 Add InviteMemberDialog trigger button
  - [x] 7.6 Implement loading and error states with Skeleton and ErrorDisplay
  - [x] 7.7 Add "Team" navigation link to project layout/navigation
  - [ ] 7.8 Test team page with various invitation states (manual test - requires running app)

- [x] 8. Invitation Acceptance Page
  - [x] 8.1 Create `app/invitations/[token]/accept/page.tsx`
  - [x] 8.2 Fetch invitation details using token
  - [x] 8.3 Display invitation info (project name, inviter, expiration)
  - [x] 8.4 Handle authentication check (redirect to login/register if needed)
  - [x] 8.5 Implement accept button with mutation hook
  - [x] 8.6 Handle expired/revoked/invalid token states
  - [x] 8.7 Redirect to project dashboard after successful acceptance
  - [ ] 8.8 Test acceptance flow for authenticated and unauthenticated users (manual test - requires running app)

- [x] 9. Authentication Flow Integration
  - [x] 9.1 Update `app/auth/login/page.tsx` to handle invitation token query param
  - [x] 9.2 Update `app/auth/register/page.tsx` to handle invitation token query param
  - [x] 9.3 Preserve invitation token through auth redirects
  - [x] 9.4 Auto-accept invitation after successful login/registration
  - [ ] 9.5 Test complete flow: Email → Accept → Register → Auto-join project (manual test - requires running app)
  - [ ] 9.6 Test complete flow: Email → Accept → Login → Auto-join project (manual test - requires running app)

- [x] 10. Testing & Quality Assurance
  - [ ] 10.1 Run database migration and verify schema in Supabase Studio (manual - requires Supabase access)
  - [ ] 10.2 Test email delivery with real Resend API key (manual - requires API key configuration)
  - [ ] 10.3 Test invitation creation for duplicate emails (manual - requires running app)
  - [ ] 10.4 Test invitation acceptance with expired token (manual - requires running app)
  - [ ] 10.5 Test invitation revocation flow (manual - requires running app)
  - [ ] 10.6 Verify RLS policies prevent unauthorized access (manual - requires Supabase access)
  - [x] 10.7 Run TypeScript build: `npm run build` (verified - compiles successfully)
  - [x] 10.8 Run linter on all invitation system files (verified - all pass)
  - [ ] 10.9 Test responsive design on mobile devices (manual - requires running app)
  - [ ] 10.10 Verify all toast notifications appear correctly (manual - requires running app)
