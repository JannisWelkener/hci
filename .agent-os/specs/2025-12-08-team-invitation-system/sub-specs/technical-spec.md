# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-12-08-team-invitation-system/spec.md

## Technical Requirements

### Email Service Integration
- **Resend SDK**: Install `resend` npm package for email delivery
- **Environment Variable**: Add `RESEND_API_KEY` to `.env.local` and `.env.example`
- **Email Service Utility**: Create centralized email service at `lib/services/email-service.ts` for sending templated emails
- **Email Template**: Simple text-based template with inviter name, project name, and acceptance link

### Database Layer
- **New Table**: `project_invitations` with columns for invitation tracking (see database-schema.md)
- **RLS Policies**: Row-level security policies ensuring users can only view/manage invitations for projects they own
- **Indexes**: Performance indexes on `project_id`, `email`, `token`, and `status` columns
- **Foreign Key Constraints**: Cascade deletion when projects or users are deleted

### API Routes (Next.js App Router)
- **POST** `/api/projects/[id]/invitations` - Create and send invitation (owner only)
- **GET** `/api/projects/[id]/invitations` - List project invitations (owner only)
- **DELETE** `/api/projects/[id]/invitations/[invitationId]` - Revoke invitation (owner only)
- **POST** `/api/invitations/[token]/accept` - Accept invitation (public, authenticated)
- **POST** `/api/invitations/[token]/decline` - Decline invitation (public, optional auth)
- **GET** `/api/invitations/[token]` - Get invitation details for acceptance page (public)

### TypeScript Types
- **InvitationStatus**: Enum/union type for 'pending' | 'accepted' | 'declined' | 'expired' | 'revoked'
- **ProjectInvitation**: Interface matching database schema
- **CreateInvitationRequest**: API request payload type
- **InvitationEmailParams**: Email template parameters type

### React Components

**IMPORTANT: Reuse Existing Components - DO NOT Recreate**

The project follows a well-established component architecture. **ALWAYS reuse existing components** rather than creating duplicates:

#### Existing Components to Reuse

**UI Components** (from `components/ui/`):
- `Dialog`, `AlertDialog` - Already exist for modals
- `DropdownMenu` - **CRITICAL: Use existing dropdown-menu.tsx, DO NOT recreate**
- `Button`, `Input`, `Badge`, `Avatar` - Standard UI elements
- `Form`, `Select`, `Textarea` - Form controls with React Hook Form integration
- `Toast` (via `sonner`) - Notification system
- `Skeleton` - Loading states
- `Table` - Data tables

**Shared Components** (from `components/shared/`):
- `FeatureFormDialog` - Standard dialog wrapper for forms
- `DeleteConfirmDialog` - Confirmation dialogs
- `FeatureEmptyState` - Empty state displays
- `FeaturePageLayout` - Page layout wrapper
- `LoadingProgress` - Loading indicators

**Project Components** (from `components/features/projects/`):
- `MemberSelector` - **EXTEND this component, don't replace it**
- `ProjectFormDialog` - Reference for dialog patterns

#### New Components to Create

Following the established pattern at `components/features/projects/`:

1. **InviteMemberDialog.tsx** - NEW component
   - Extends/integrates with existing `MemberSelector` component
   - Add "Invite via Email" option alongside existing user search
   - Use existing `Dialog` and `Form` components
   - Use existing `Input` for email entry
   - Use existing `Button` for actions

2. **PendingInvitationsList.tsx** - NEW component
   - Display pending invitations in table format
   - Use existing `Table` component from `components/ui/table.tsx`
   - Use existing `Badge` for status indicators
   - Use existing `DropdownMenu` for actions (revoke, resend, etc.)
   - Use existing `Avatar` for inviter display

3. **InvitationStatusBadge.tsx** - NEW component (simple)
   - Wraps existing `Badge` component with status-specific colors
   - Maps status to variant/color

#### Page Components

Create following existing page structure (`app/projects/[projectId]/`):

1. **app/projects/[projectId]/team/page.tsx** - NEW page
   - Use existing `FeaturePageLayout` wrapper
   - Display current members (reuse existing member display logic)
   - Show pending invitations using `PendingInvitationsList`
   - Include `InviteMemberDialog` trigger button

2. **app/invitations/[token]/accept/page.tsx** - NEW page
   - Standalone acceptance page for invitation links
   - Use existing `Card` and `Button` components
   - Handle authentication redirects

### Page Routes
- **Team Management Page**: `/app/projects/[id]/team/page.tsx` - Main team management interface
- **Accept Invitation Page**: `/app/invitations/[token]/accept/page.tsx` - Invitation acceptance landing page

### TanStack Query Hooks
- **useProjectInvitations**: Query hook for fetching project invitations
- **useCreateInvitation**: Mutation hook for creating invitations
- **useRevokeInvitation**: Mutation hook for revoking invitations
- **useAcceptInvitation**: Mutation hook for accepting invitations
- **useInvitationDetails**: Query hook for fetching invitation details by token

### Validation & Security
- **Zod Schemas**: Email validation, UUID validation for project/invitation IDs, token format validation
- **Authentication Checks**: Verify project ownership for invitation management actions
- **Token Generation**: Cryptographically secure random tokens for invitation URLs
- **Expiration Logic**: Automatic expiration check (14 days from creation)
- **Duplicate Prevention**: Check for existing pending invitations to same email for same project

### State Management
- **Optimistic Updates**: TanStack Query optimistic updates for invitation creation/revocation
- **Cache Invalidation**: Invalidate project members and invitations queries after acceptance
- **Error Handling**: Comprehensive error states with user-friendly messages via toast notifications

### UI/UX Considerations
- **Loading States**: Skeleton loaders for invitation lists
- **Empty States**: Friendly empty state when no pending invitations
- **Success Feedback**: Toast notifications for successful invitation send, acceptance, revocation
- **Error Feedback**: Clear error messages for expired tokens, duplicate invitations, invalid emails
- **Responsive Design**: Mobile-friendly team management interface using Tailwind CSS

### Integration Points & Component Reuse Strategy

**Follow Established Patterns - Critical Guidelines:**

1. **Component Structure**
   - Place new invitation components in `components/features/projects/`
   - Follow naming convention: `[Feature][ComponentType].tsx` (e.g., `InviteMemberDialog.tsx`)
   - Use existing component exports pattern from `components/features/projects/index.ts`

2. **Dialog Patterns**
   - **MUST use** existing `FeatureFormDialog` wrapper from `components/shared/`
   - **MUST use** existing `Dialog` primitives from `components/ui/dialog.tsx`
   - Reference `ProjectFormDialog.tsx` for implementation pattern
   - DO NOT create custom dialog wrappers

3. **Dropdown Menus**
   - **CRITICAL**: Use existing `DropdownMenu` from `components/ui/dropdown-menu.tsx`
   - DO NOT recreate dropdown functionality
   - Follow pattern: DropdownMenu → DropdownMenuTrigger → DropdownMenuContent → DropdownMenuItem

4. **Form Handling**
   - Use existing `Form` components from `components/ui/form.tsx`
   - Integrate with React Hook Form (already configured)
   - Use Zod validation schemas (existing pattern)

5. **Table Display**
   - Use existing `Table` component from `components/ui/table.tsx`
   - Reference other feature tables for pagination/sorting patterns

6. **Toast Notifications**
   - Use `toast` from `sonner` (already imported in project)
   - Pattern: `toast.success()`, `toast.error()`
   - DO NOT create custom notification system

7. **Existing Member Selector Extension**
   - **EXTEND** `MemberSelector.tsx`, don't replace
   - Add "Invite via Email" tab/option to existing component
   - Preserve all existing functionality
   - Maintain existing props interface

8. **Project Navigation**
   - Add "Team" link to existing project navigation
   - Follow routing pattern: `/projects/[projectId]/team`
   - Integrate with existing project layout

9. **Authentication Flow**
   - Preserve invitation token through redirects via query parameters
   - Pattern: `?invitation_token={token}&redirect=/invitations/{token}/accept`
   - Use existing auth redirects from `app/auth/` pages

10. **Styling Consistency**
    - Use existing Tailwind utility classes
    - Follow dark mode patterns already established
    - Match spacing, colors, and typography from existing components

### Performance Considerations
- **Database Indexes**: Ensure fast lookups for token-based invitation retrieval
- **Email Queue**: Consider background job processing for email sending (optional future enhancement)
- **Cron Job**: Periodic cleanup of expired invitations (manual or scheduled)

### Testing Requirements
- **Email Delivery**: Test Resend integration in development with test API key
- **Invitation Flow**: End-to-end testing of invitation creation, email reception, and acceptance
- **Expiration Logic**: Verify 14-day expiration enforcement
- **Security**: Test unauthorized access attempts to invitation management endpoints
- **Edge Cases**: Test duplicate invitations, expired tokens, revoked invitations

## Component Architecture Reference

### Existing Project Structure

```
components/
├── ui/                          # shadcn/ui components (DO NOT recreate)
│   ├── dialog.tsx               ✓ Use for modals
│   ├── dropdown-menu.tsx        ✓ CRITICAL: Use for action menus
│   ├── form.tsx                 ✓ Use for form fields
│   ├── table.tsx                ✓ Use for data tables
│   ├── badge.tsx                ✓ Use for status indicators
│   ├── button.tsx               ✓ Use for all buttons
│   ├── input.tsx                ✓ Use for text inputs
│   └── ...
├── shared/                      # Reusable feature components
│   ├── FeatureFormDialog.tsx    ✓ Standard dialog wrapper
│   ├── DeleteConfirmDialog.tsx  ✓ Confirmation dialogs
│   ├── FeaturePageLayout.tsx    ✓ Page layout wrapper
│   └── ...
└── features/
    └── projects/                # Project-specific components
        ├── MemberSelector.tsx   ✓ EXTEND for invitations
        ├── ProjectFormDialog.tsx ✓ Reference pattern
        ├── ProjectCard.tsx
        ├── ProjectList.tsx
        └── ...
```

### New Components Location

```
components/features/projects/
├── InviteMemberDialog.tsx       ← NEW (email invitation form)
├── PendingInvitationsList.tsx   ← NEW (invitation table)
├── InvitationStatusBadge.tsx    ← NEW (status badge wrapper)
└── MemberSelector.tsx           ← MODIFY (add invite option)

app/
├── projects/[projectId]/
│   └── team/
│       └── page.tsx             ← NEW (team management page)
└── invitations/[token]/
    └── accept/
        └── page.tsx             ← NEW (acceptance page)
```

### Import Pattern Examples

```typescript
// ✓ CORRECT: Reuse existing UI components
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

// ✓ CORRECT: Reuse shared components
import { FeatureFormDialog } from "@/components/shared/FeatureFormDialog"
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog"

// ✓ CORRECT: Extend existing feature components
import { MemberSelector } from "@/components/features/projects/MemberSelector"

// ✓ CORRECT: Use existing hooks
import { useProfiles } from "@/lib/hooks/use-profiles"
import { toast } from "sonner"

// ✗ INCORRECT: DO NOT create duplicates
// import { CustomDialog } from "./CustomDialog"  ← NO
// import { CustomDropdown } from "./CustomDropdown"  ← NO
```

## External Dependencies

### Resend Email Service
- **Package**: `resend` (latest stable version)
- **Purpose**: Transactional email delivery for project invitations
- **Justification**: Resend provides a modern, developer-friendly API with excellent deliverability, TypeScript support, and straightforward integration. It's already chosen by the user and has existing environment configuration planned.
- **Documentation**: https://resend.com/docs
- **Installation**: `npm install resend`
