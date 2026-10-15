# Spec Tasks

## Tasks

- [x] 1. API Routes Implementation - User Stories CRUD
  - [x] 1.1 Create Zod validation schemas for user story create/update requests
  - [x] 1.2 Implement GET /api/projects/[projectId]/user-stories with sorting and pagination
  - [x] 1.3 Implement GET /api/projects/[projectId]/user-stories/[storyId] for single story
  - [x] 1.4 Implement POST /api/projects/[projectId]/user-stories for creation
  - [x] 1.5 Implement PATCH /api/projects/[projectId]/user-stories/[storyId] for updates
  - [x] 1.6 Implement DELETE /api/projects/[projectId]/user-stories/[storyId] with confirmation
  - [x] 1.7 Add proper error handling and validation for all endpoints
  - [x] 1.8 Test all API endpoints manually (refer to API_TESTING.md pattern)

- [x] 2. Data Layer - TanStack Query Hooks
  - [x] 2.1 Create useUserStories hook for fetching user stories list with sorting
  - [x] 2.2 Create useUserStory hook for fetching single user story
  - [x] 2.3 Create useCreateUserStory mutation hook with optimistic updates
  - [x] 2.4 Create useUpdateUserStory mutation hook with cache invalidation
  - [x] 2.5 Create useDeleteUserStory mutation hook with optimistic removal
  - [x] 2.6 Configure proper query keys and cache invalidation strategies
  - [x] 2.7 Add error handling and toast notifications for all mutations
  - [x] 2.8 Verify TypeScript types and hook integration

- [x] 3. Core UI Components - Form and Input Management
  - [x] 3.1 Create AcceptanceCriteriaInput component with useFieldArray for dynamic add/remove
  - [x] 3.2 Implement UserStoryForm component with React Hook Form and Zod validation
  - [x] 3.3 Add form fields: title, user_role, action, benefit with validation
  - [x] 3.4 Add metadata fields: priority dropdown, status dropdown, story_points input
  - [x] 3.5 Integrate AcceptanceCriteriaInput into form with +/- controls
  - [x] 3.6 Add form-level validation, error messages, and helper text
  - [x] 3.7 Support both create and edit modes with proper initial values
  - [x] 3.8 Test form validation and submission with all field combinations

- [x] 4. Display Components - List and Card Views
  - [x] 4.1 Create UserStoryCard component with title, priority badge, status badge, story points
  - [x] 4.2 Implement UserStoriesList component with grid/table layout
  - [x] 4.3 Add sorting controls (by priority, status, created_at) to list view
  - [x] 4.4 Implement empty state with illustration and "New User Story" call-to-action
  - [x] 4.5 Add loading states with skeleton loaders
  - [x] 4.6 Add error states with retry functionality
  - [x] 4.7 Implement click handler to navigate to detail view
  - [x] 4.8 Test responsive layout on mobile, tablet, and desktop viewports

- [x] 5. Detail View and Edit Functionality
  - [x] 5.1 Create UserStoryDetail component with formatted story display
  - [x] 5.2 Display user story as "As a [role], I want [action], so that [benefit]"
  - [x] 5.3 Show metadata section with priority, status, story points indicators
  - [x] 5.4 Display acceptance criteria as numbered list
  - [x] 5.5 Add Edit button to toggle edit mode using UserStoryForm
  - [x] 5.6 Add Delete button with confirmation dialog (AlertDialog)
  - [x] 5.7 Implement Back to List navigation
  - [ ] 5.8 Test view/edit mode toggling and data persistence

- [x] 6. Page Integration and Routing
  - [x] 6.1 Update app/projects/[projectId]/user-stories/page.tsx with UserStoriesList
  - [x] 6.2 Create app/projects/[projectId]/user-stories/[storyId]/page.tsx for detail view
  - [x] 6.3 Add "New User Story" button/dialog to list page
  - [x] 6.4 Integrate UserStoryForm in modal (Dialog) or dedicated create page
  - [x] 6.5 Connect all CRUD operations with proper state management
  - [x] 6.6 Add success/error toast notifications for all actions
  - [ ] 6.7 Test complete user workflows (create, view, edit, delete, sort)
  - [ ] 6.8 Verify routing and navigation between list and detail views

- [x] 7. Quality Assurance and Polish
  - [x] 7.1 Add proper TypeScript types for all components and hooks
  - [x] 7.2 Implement keyboard navigation (Tab, Enter, Escape) for forms and dialogs
  - [x] 7.3 Add ARIA labels and semantic HTML for accessibility
  - [ ] 7.4 Test with screen reader for WCAG 2.1 AA compliance
  - [x] 7.5 Verify color contrast and visual indicators meet accessibility standards
  - [ ] 7.6 Run npm run build and verify successful compilation (blocked by unrelated mockup errors)
  - [x] 7.7 Run npm run lint and fix any linting errors (user stories code has no errors)
  - [x] 7.8 Run npx tsc --noEmit and verify no TypeScript errors (user stories code has no errors)

- [x] 8. Component Export and Documentation
  - [x] 8.1 Create components/features/user-stories/index.ts with all exports
  - [x] 8.2 Update component structure to match existing patterns (features/user-stories/)
  - [x] 8.3 Add inline documentation/comments for complex logic
  - [ ] 8.4 Update project navigation sidebar if needed
  - [x] 8.5 Create lib/hooks/use-user-stories.ts following existing hook patterns
  - [x] 8.6 Verify all imports and exports are correct
  - [ ] 8.7 Test end-to-end user story management workflow in browser
  - [ ] 8.8 Final regression testing and verification of all features
