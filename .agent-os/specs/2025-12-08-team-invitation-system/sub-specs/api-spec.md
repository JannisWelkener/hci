# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-12-08-team-invitation-system/spec.md

## Overview

All API endpoints follow RESTful conventions and return standardized JSON responses using the existing `successResponse()` and `errorResponse()` utility functions from `/lib/utils/api.ts`.

### Standard Response Format

```typescript
// Success response
{
  "data": T,
  "error": null
}

// Error response
{
  "data": null,
  "error": {
    "message": string,
    "code": string | undefined
  }
}
```

## Endpoints

### 1. Create and Send Invitation

**Endpoint:** `POST /api/projects/[id]/invitations`

**Purpose:** Send an email invitation to a collaborator to join a project

**Authentication:** Required (must be project owner)

**Route File:** `/app/api/projects/[id]/invitations/route.ts`

**Request Parameters:**
- Path: `id` (UUID) - Project ID

**Request Body:**
```typescript
{
  email: string;      // Valid email address (required)
  role?: string;      // Optional role (defaults to 'member')
}
```

**Validation Schema (Zod):**
```typescript
const createInvitationSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['owner', 'editor', 'viewer', 'member']).default('member')
});
```

**Success Response (201 Created):**
```typescript
{
  data: {
    id: string;              // Invitation ID
    project_id: string;      // Project ID
    email: string;           // Invitee email
    status: 'pending';       // Always 'pending' for new invitations
    role: string;            // Assigned role
    invited_at: string;      // ISO timestamp
    expires_at: string;      // ISO timestamp (14 days from now)
  },
  error: null
}
```

**Error Responses:**

| Status | Message | Scenario |
|--------|---------|----------|
| 401 | Unauthorized | User not authenticated |
| 403 | You must be the project owner to send invitations | User is not project owner |
| 404 | Project not found | Project ID doesn't exist or user has no access |
| 400 | Invalid email address | Email validation failed |
| 409 | User is already a member of this project | Email belongs to existing member |
| 409 | Pending invitation already exists for this email | Active invitation already sent |
| 500 | Failed to send invitation email | Resend API failure |

**Business Logic:**
1. Verify user is authenticated
2. Verify user owns the project (via RLS or explicit check)
3. Validate email format
4. Check if email already exists in `project_members` for this project
5. Check if pending invitation already exists for this email+project
6. Generate cryptographically secure token (UUID v4)
7. Insert invitation record with 14-day expiration
8. Send email via Resend with invitation link
9. Return invitation details

**Example Request:**
```bash
POST /api/projects/abc-123/invitations
Content-Type: application/json

{
  "email": "colleague@example.com",
  "role": "member"
}
```

---

### 2. List Project Invitations

**Endpoint:** `GET /api/projects/[id]/invitations`

**Purpose:** Retrieve all invitations for a specific project

**Authentication:** Required (must be project owner)

**Route File:** `/app/api/projects/[id]/invitations/route.ts`

**Request Parameters:**
- Path: `id` (UUID) - Project ID
- Query (optional):
  - `status` - Filter by status (pending | accepted | declined | expired | revoked)

**Success Response (200 OK):**
```typescript
{
  data: Array<{
    id: string;
    project_id: string;
    email: string;
    status: 'pending' | 'accepted' | 'declined' | 'expired' | 'revoked';
    role: string;
    invited_at: string;     // ISO timestamp
    expires_at: string;     // ISO timestamp
    accepted_at: string | null;
    inviter: {
      id: string;
      full_name: string;
      email: string;
    }
  }>,
  error: null
}
```

**Error Responses:**

| Status | Message | Scenario |
|--------|---------|----------|
| 401 | Unauthorized | User not authenticated |
| 403 | You must be the project owner to view invitations | User is not project owner |
| 404 | Project not found | Project ID doesn't exist |

**Example Request:**
```bash
GET /api/projects/abc-123/invitations?status=pending
```

---

### 3. Revoke Invitation

**Endpoint:** `DELETE /api/projects/[id]/invitations/[invitationId]`

**Purpose:** Revoke a pending invitation (owner cancels invitation)

**Authentication:** Required (must be project owner)

**Route File:** `/app/api/projects/[id]/invitations/[invitationId]/route.ts`

**Request Parameters:**
- Path: `id` (UUID) - Project ID
- Path: `invitationId` (UUID) - Invitation ID

**Success Response (200 OK):**
```typescript
{
  data: {
    message: 'Invitation revoked successfully'
  },
  error: null
}
```

**Error Responses:**

| Status | Message | Scenario |
|--------|---------|----------|
| 401 | Unauthorized | User not authenticated |
| 403 | You must be the project owner to revoke invitations | User is not project owner |
| 404 | Invitation not found | Invitation ID doesn't exist |
| 400 | Invitation is no longer pending | Invitation already accepted/declined/expired |

**Business Logic:**
1. Verify user is authenticated
2. Verify user owns the project
3. Check invitation exists and belongs to this project
4. Verify invitation status is 'pending'
5. Update status to 'revoked'
6. Return success

**Example Request:**
```bash
DELETE /api/projects/abc-123/invitations/def-456
```

---

### 4. Get Invitation Details (Public)

**Endpoint:** `GET /api/invitations/[token]`

**Purpose:** Retrieve invitation details for the acceptance page (public endpoint)

**Authentication:** Not required (uses token for validation)

**Route File:** `/app/api/invitations/[token]/route.ts`

**Request Parameters:**
- Path: `token` (string) - Invitation token from email link

**Success Response (200 OK):**
```typescript
{
  data: {
    id: string;
    email: string;
    status: string;
    expires_at: string;
    is_expired: boolean;
    project: {
      id: string;
      name: string;
      description: string;
    },
    inviter: {
      full_name: string;
      email: string;
    }
  },
  error: null
}
```

**Error Responses:**

| Status | Message | Scenario |
|--------|---------|----------|
| 404 | Invitation not found | Invalid token |
| 410 | Invitation has expired | Invitation past expiration date |
| 410 | Invitation has been revoked | Owner cancelled invitation |
| 410 | Invitation already accepted | Invitation already processed |

**Example Request:**
```bash
GET /api/invitations/abc-def-ghi-jkl
```

---

### 5. Accept Invitation

**Endpoint:** `POST /api/invitations/[token]/accept`

**Purpose:** Accept an invitation and join the project

**Authentication:** Required (user must be logged in)

**Route File:** `/app/api/invitations/[token]/accept/route.ts`

**Request Parameters:**
- Path: `token` (string) - Invitation token from email link

**Request Body:** None

**Success Response (200 OK):**
```typescript
{
  data: {
    message: 'Invitation accepted successfully',
    project_id: string;     // Project ID to redirect to
    project_name: string;   // Project name for UI feedback
  },
  error: null
}
```

**Error Responses:**

| Status | Message | Scenario |
|--------|---------|----------|
| 401 | Unauthorized | User not authenticated |
| 404 | Invitation not found | Invalid token |
| 410 | Invitation has expired | Past expiration date |
| 410 | Invitation has been revoked | Owner cancelled |
| 410 | Invitation already accepted | Already processed |
| 409 | You are already a member of this project | User already in project_members |
| 400 | This invitation was sent to a different email address | Logged-in email doesn't match invitation email |

**Business Logic:**
1. Verify user is authenticated
2. Retrieve invitation by token
3. Validate invitation is pending and not expired
4. **Optional:** Check if logged-in user's email matches invitation email
5. Call `accept_project_invitation()` database function
6. Return success with project details for redirect

**Example Request:**
```bash
POST /api/invitations/abc-def-ghi-jkl/accept
```

---

### 6. Decline Invitation

**Endpoint:** `POST /api/invitations/[token]/decline`

**Purpose:** Decline an invitation (user chooses not to join)

**Authentication:** Optional (can decline without account)

**Route File:** `/app/api/invitations/[token]/decline/route.ts`

**Request Parameters:**
- Path: `token` (string) - Invitation token from email link

**Request Body:** None

**Success Response (200 OK):**
```typescript
{
  data: {
    message: 'Invitation declined'
  },
  error: null
}
```

**Error Responses:**

| Status | Message | Scenario |
|--------|---------|----------|
| 404 | Invitation not found | Invalid token |
| 410 | Invitation has expired | Past expiration date |
| 410 | Invitation has been revoked | Owner cancelled |
| 410 | Invitation already processed | Already accepted/declined |

**Business Logic:**
1. Retrieve invitation by token
2. Validate invitation is pending and not expired
3. Update status to 'declined'
4. Return success

**Example Request:**
```bash
POST /api/invitations/abc-def-ghi-jkl/decline
```

---

## Email Integration (Resend)

### Email Service Module

**File:** `/lib/services/email-service.ts`

**Function:** `sendInvitationEmail(params: InvitationEmailParams)`

**Parameters:**
```typescript
interface InvitationEmailParams {
  to: string;              // Recipient email
  inviterName: string;     // Name of person sending invite
  projectName: string;     // Project name
  acceptUrl: string;       // Full URL to accept invitation
}
```

**Email Template (Plain Text):**
```
Subject: Invitation to join "{projectName}" on HCI Hub

{inviterName} wants to invite you to {projectName}

Accept Invitation: {acceptUrl}

This invitation will expire in 14 days.

---
HCI Hub - Human-Centered Design Project Management
```

**Accept URL Format:**
```
https://your-domain.com/invitations/{token}/accept
```

**Implementation:**
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendInvitationEmail(params: InvitationEmailParams) {
  const { to, inviterName, projectName, acceptUrl } = params;

  const { data, error } = await resend.emails.send({
    from: 'HCI Hub <noreply@your-domain.com>',
    to: [to],
    subject: `Invitation to join "${projectName}" on HCI Hub`,
    text: `${inviterName} wants to invite you to ${projectName}\n\nAccept Invitation: ${acceptUrl}\n\nThis invitation will expire in 14 days.\n\n---\nHCI Hub - Human-Centered Design Project Management`
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return data;
}
```

---

## Authentication Flow Integration

### Accepting Invitation as New User

**Flow:**
1. User clicks "Accept Invitation" link in email
2. App checks if user is authenticated
3. If not authenticated:
   - Redirect to `/auth/register?invitation_token={token}`
   - Store token in query parameter
4. After successful registration:
   - Redirect to `/invitations/{token}/accept`
   - Auto-accept invitation via API
5. Redirect to project dashboard

### Accepting Invitation as Existing User

**Flow:**
1. User clicks "Accept Invitation" link in email
2. App checks if user is authenticated
3. If not authenticated:
   - Redirect to `/auth/login?invitation_token={token}&redirect=/invitations/{token}/accept`
4. After login:
   - Redirect to `/invitations/{token}/accept`
   - Auto-accept invitation via API
5. Redirect to project dashboard

---

## Error Handling Strategy

### Client-Side (React Components)

```typescript
// Example mutation hook usage
const { mutate: acceptInvitation, isPending, error } = useAcceptInvitation();

// Error handling in component
if (error) {
  // Show toast notification with error message
  toast.error(error.message);
}
```

### Server-Side (API Routes)

```typescript
// Centralized error handling pattern
try {
  // Business logic
} catch (error) {
  console.error('Error accepting invitation:', error);
  return errorResponse(
    'Failed to accept invitation. Please try again.',
    500
  );
}
```

### Database-Level

- Foreign key constraints prevent orphaned records
- Check constraints ensure valid status values
- RLS policies prevent unauthorized access
- Transaction handling in `accept_project_invitation()` function ensures atomicity

---

## Rate Limiting Considerations

**Future Enhancement:** Implement rate limiting on invitation sending to prevent abuse:
- Max 10 invitations per project per hour
- Max 50 invitations per user per day
- Use Redis or Upstash for distributed rate limiting

---

## Testing Endpoints

### Manual Testing with cURL

```bash
# 1. Create invitation
curl -X POST http://localhost:3000/api/projects/{projectId}/invitations \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "role": "member"}'

# 2. List invitations
curl http://localhost:3000/api/projects/{projectId}/invitations

# 3. Get invitation details
curl http://localhost:3000/api/invitations/{token}

# 4. Accept invitation (requires auth cookie)
curl -X POST http://localhost:3000/api/invitations/{token}/accept

# 5. Revoke invitation (requires auth cookie)
curl -X DELETE http://localhost:3000/api/projects/{projectId}/invitations/{invitationId}
```

### Testing Checklist

- [ ] Create invitation with valid email
- [ ] Create invitation with invalid email (expect 400)
- [ ] Create duplicate invitation (expect 409)
- [ ] List all invitations for project
- [ ] Accept valid invitation
- [ ] Accept expired invitation (expect 410)
- [ ] Accept revoked invitation (expect 410)
- [ ] Revoke pending invitation
- [ ] Verify email delivery via Resend dashboard
- [ ] Test authentication redirects for new users
- [ ] Test authentication redirects for existing users

---

## API Documentation Summary

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/projects/[id]/invitations` | POST | Required (owner) | Send invitation |
| `/api/projects/[id]/invitations` | GET | Required (owner) | List invitations |
| `/api/projects/[id]/invitations/[invitationId]` | DELETE | Required (owner) | Revoke invitation |
| `/api/invitations/[token]` | GET | Public | Get invitation details |
| `/api/invitations/[token]/accept` | POST | Required | Accept invitation |
| `/api/invitations/[token]/decline` | POST | Optional | Decline invitation |
