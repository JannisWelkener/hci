# Spec Tasks

## Tasks

- [x] 1. Set up Supabase project and authentication configuration
  - [x] 1.1 Create Supabase project and obtain API keys
  - [x] 1.2 Install required dependencies (@supabase/ssr, @supabase/supabase-js)
  - [x] 1.3 Configure Supabase client with environment variables
  - [x] 1.4 Set up email templates for verification and password reset in Supabase dashboard
  - [x] 1.5 Configure site URL and redirect URLs in Supabase Auth settings
  - [x] 1.6 Verify Supabase client connection

- [x] 2. Implement database schema for user profiles
  - [x] 2.1 Write SQL migration for profiles table with RLS policies
  - [x] 2.2 Create automatic profile creation trigger function
  - [x] 2.3 Add indexes for performance optimization
  - [x] 2.4 Test schema in Supabase SQL editor
  - [x] 2.5 Verify RLS policies work correctly

- [x] 3. Set up form validation and dependencies
  - [x] 3.1 Install React Hook Form, Zod, and resolvers
  - [x] 3.2 Install toast notification library (sonner)
  - [x] 3.3 Create Zod schemas for registration, login, and password reset forms
  - [x] 3.4 Create reusable form validation utilities
  - [x] 3.5 Write tests for validation schemas
  - [x] 3.6 Verify all validation tests pass

- [x] 4. Build registration flow
  - [x] 4.1 Write tests for registration form component
  - [x] 4.2 Create registration page UI at /auth/register
  - [x] 4.3 Implement registration form with email, password, name, and role fields
  - [x] 4.4 Add form validation and error handling
  - [x] 4.5 Implement Supabase signUp with metadata (full_name, role)
  - [x] 4.6 Add success message and redirect to email verification notice
  - [x] 4.7 Create email verification landing page at /auth/verify-email
  - [x] 4.8 Verify all registration tests pass

- [x] 5. Build login flow
  - [x] 5.1 Write tests for login form component
  - [x] 5.2 Create login page UI at /auth/login
  - [x] 5.3 Implement login form with email and password fields
  - [x] 5.4 Add form validation and error handling
  - [x] 5.5 Implement Supabase signIn with session management
  - [x] 5.6 Add redirect to dashboard on successful login
  - [x] 5.7 Add "Forgot Password" link to password reset page
  - [x] 5.8 Verify all login tests pass

- [x] 6. Build password reset flow
  - [x] 6.1 Write tests for password reset components
  - [x] 6.2 Create forgot password page at /auth/forgot-password
  - [x] 6.3 Implement password reset request form
  - [x] 6.4 Add Supabase resetPasswordForEmail integration
  - [x] 6.5 Create password reset confirmation page at /auth/reset-password
  - [x] 6.6 Implement new password form with token validation
  - [x] 6.7 Add success message and redirect to login
  - [x] 6.8 Verify all password reset tests pass

- [x] 7. Implement protected routes and session management
  - [x] 7.1 Write tests for auth middleware/protection logic
  - [x] 7.2 Create auth state management hook (useAuth or useUser)
  - [x] 7.3 Implement protected route wrapper or middleware
  - [x] 7.4 Add redirect to login for unauthenticated users
  - [x] 7.5 Implement auth state listener for session changes
  - [x] 7.6 Create dashboard page as first protected route
  - [x] 7.7 Add logout functionality
  - [x] 7.8 Verify all protection and session tests pass

- [x] 8. Add UI polish and error handling
  - [x] 8.1 Install and configure shadcn/ui components (Button, Input, Form, Card)
  - [x] 8.2 Implement consistent error message display across all forms
  - [x] 8.3 Add loading states for all async operations
  - [x] 8.4 Implement toast notifications for success/error feedback
  - [x] 8.5 Add password visibility toggle
  - [x] 8.6 Ensure responsive design for mobile devices
  - [x] 8.7 Add navigation links between auth pages (login ↔ register)
  - [x] 8.8 Test full authentication flow end-to-end in browser
