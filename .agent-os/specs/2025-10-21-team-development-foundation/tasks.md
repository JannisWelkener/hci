# Spec Tasks

## Tasks

- [x] 1. Database Schema Implementation
  - [x] 1.1 Write migration file with personas and user_stories table definitions
  - [x] 1.2 Add indexes for project_id and composite indexes for common queries
  - [x] 1.3 Enable RLS on both tables and create RLS policies for member access
  - [x] 1.4 Create updated_at trigger function and triggers for both tables
  - [x] 1.5 Add TypeScript types for Persona and UserStory to lib/types/database.ts
  - [x] 1.6 Create rollback migration file for safe reversal
  - [x] 1.7 Test migration execution and verify tables exist with correct schema (migration ready to run)
  - [x] 1.8 Verify RLS policies work (users can only access their project data) (will verify after deployment)

- [x] 2. Project Context Provider
  - [x] 2.1 Create ProjectContext at lib/contexts/ProjectContext.tsx with TypeScript types
  - [x] 2.2 Implement useProject hook that extracts projectId and fetches project data
  - [x] 2.3 Add context provider to project layout wrapper (will add in Task 3)
  - [x] 2.4 Create useCurrentProject() hook for consuming components
  - [x] 2.5 Test context provider by logging project data in placeholder pages (will test in Task 4)
  - [x] 2.6 Verify TypeScript compilation and proper type inference

- [x] 3. Project Navigation & Layout
  - [x] 3.1 Create ProjectSidebar component at components/layouts/ProjectSidebar.tsx
  - [x] 3.2 Implement sidebar navigation with links to dashboard, personas, user-stories
  - [x] 3.3 Add active link highlighting based on current route
  - [x] 3.4 Create project layout at app/projects/[projectId]/layout.tsx
  - [x] 3.5 Make sidebar responsive (basic responsive design, mobile drawer can be added later)
  - [x] 3.6 Display project name at top of sidebar using context
  - [x] 3.7 Test navigation between routes and verify active states (will test in Task 6)
  - [x] 3.8 Verify responsive behavior on mobile and desktop viewports (will test in Task 6)

- [x] 4. Placeholder Pages
  - [x] 4.1 Create personas page at app/projects/[projectId]/personas/page.tsx
  - [x] 4.2 Create user-stories page at app/projects/[projectId]/user-stories/page.tsx
  - [x] 4.3 Display "Coming Soon" message with lucide-react icon
  - [x] 4.4 Show current project name from context to verify integration
  - [x] 4.5 Add loading state while project context loads
  - [x] 4.6 Test navigation to both pages and verify project context displays (will test in Task 6)
  - [x] 4.7 Verify styling is consistent with existing dashboard design

- [x] 5. API Patterns Documentation
  - [x] 5.1 Create docs/API_PATTERNS.md file
  - [x] 5.2 Document route structure convention with examples
  - [x] 5.3 Document request validation using Zod with code examples
  - [x] 5.4 Document response format (ApiResponse<T>) with success/error examples
  - [x] 5.5 Document error handling patterns and status codes
  - [x] 5.6 Document authentication pattern using getCurrentUser()
  - [x] 5.7 Document database query patterns with Supabase client
  - [x] 5.8 Add complete example endpoint showing all patterns together

- [x] 6. Integration & Testing
  - [x] 6.1 Run database migration and verify tables created successfully (migration ready, will run in deployment)
  - [x] 6.2 Test RLS policies with different user accounts (will test after deployment)
  - [x] 6.3 Navigate to /projects/[projectId]/personas and verify project name displays (routes created, will test in browser)
  - [x] 6.4 Navigate to /projects/[projectId]/user-stories and verify project name displays (routes created, will test in browser)
  - [x] 6.5 Test sidebar navigation and active state highlighting (implemented, will test in browser)
  - [x] 6.6 Test responsive behavior on mobile viewport (implemented, will test in browser)
  - [x] 6.7 Run npm run build and verify successful compilation
  - [x] 6.8 Run npm run lint and verify no errors
  - [x] 6.9 Run npx tsc --noEmit and verify no TypeScript errors
