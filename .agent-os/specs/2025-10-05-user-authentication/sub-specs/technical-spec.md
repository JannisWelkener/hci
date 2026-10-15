# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-10-05-user-authentication/spec.md

## Technical Requirements

### Authentication Provider Setup
- Set up Supabase project with Auth configuration
- Configure email templates for verification and password reset
- Enable email provider in Supabase Auth settings
- Configure site URL and redirect URLs for email verification and password reset flows

### Frontend Components
- **Registration Form** - Email, password, full name, and role (dropdown: Student/Instructor) fields with real-time validation
- **Login Form** - Email and password fields with error handling
- **Password Reset Request Form** - Email input with submission feedback
- **Password Reset Confirmation Form** - New password input accessible via email link
- **Email Verification Landing Page** - Page to handle email verification token from link

### Form Validation
- Email format validation using Zod schema
- Password requirements: minimum 8 characters, at least one uppercase, one lowercase, one number
- Name: required, minimum 2 characters
- Role: required selection from dropdown
- Client-side validation with React Hook Form
- Server-side validation errors displayed to user

### Route Structure
- `/auth/register` - Registration page
- `/auth/login` - Login page
- `/auth/forgot-password` - Password reset request page
- `/auth/reset-password` - Password reset confirmation page (accessed via email link)
- `/auth/verify-email` - Email verification confirmation page (accessed via email link)
- `/dashboard` - Protected route requiring authentication
- Root `/` - Landing page with redirect to dashboard if authenticated

### Session Management
- Supabase Auth handles session tokens automatically
- Store session in secure HTTP-only cookies (Supabase default)
- Implement auth state listener for automatic UI updates
- Handle session refresh automatically via Supabase client

### Protected Routes Implementation
- Create middleware or layout-based auth checking
- Redirect unauthenticated users to `/auth/login`
- Preserve intended destination for post-login redirect
- Check auth state on client-side navigation

### Error Handling
- Display user-friendly error messages for:
  - Invalid credentials
  - Email already registered
  - Weak passwords
  - Network errors
  - Expired reset tokens
  - Invalid verification tokens
- Loading states for all async operations
- Toast notifications for success/error feedback

### UI/UX Specifications
- Use shadcn/ui components for forms and buttons
- Responsive design (mobile-first approach)
- Accessible forms with proper labels and ARIA attributes
- Password visibility toggle
- "Remember me" checkbox (optional, uses Supabase session persistence)
- Link between login/register pages
- Professional, clean design matching Geist font aesthetics

## External Dependencies

- **@supabase/supabase-js** (^2.x) - Supabase JavaScript client for auth operations
  - **Justification:** Official Supabase client required for authentication integration

- **@supabase/auth-helpers-nextjs** (^0.x) - Next.js specific auth helpers
  - **Justification:** Provides Next.js middleware and server-side auth utilities

- **react-hook-form** (^7.x) - Form state management and validation
  - **Justification:** Efficient form handling with minimal re-renders, integrates well with Zod

- **zod** (^3.x) - TypeScript-first schema validation
  - **Justification:** Type-safe form validation matching tech stack preferences

- **@hookform/resolvers** (^3.x) - Resolver for React Hook Form + Zod integration
  - **Justification:** Bridge between React Hook Form and Zod schemas

- **sonner** or **react-hot-toast** (^1.x) - Toast notification library
  - **Justification:** User feedback for auth operations (success/error messages)
