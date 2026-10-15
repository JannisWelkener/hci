# Spec Tasks

## Tasks

- [x] 1. Database Layer - Cascade Deletion Infrastructure
  - [x] 1.1 Create migration file for indexes and cascade deletion function
  - [x] 1.2 Implement `delete_user_story_with_cascade` PostgreSQL function with transaction handling
  - [x] 1.3 Create performance indexes on `user_journey_map_timeline` table
  - [x] 1.4 Add function permissions for authenticated users
  - [x] 1.5 Test function execution with sample data (verify cascade deletion works)
  - [x] 1.6 Apply migration to Supabase and verify schema changes

- [x] 2. Backend API - Journey Map Dependency Endpoint
  - [x] 2.1 Create new API route file at `app/api/projects/[id]/user-stories/[storyId]/journey-map-dependencies/route.ts`
  - [x] 2.2 Implement GET handler with authentication and authorization checks
  - [x] 2.3 Write query to fetch affected journey maps from `user_journey_map_timeline` table
  - [x] 2.4 Format response with journey map details (id, title, created_at)
  - [x] 2.5 Add error handling for unauthorized access and missing resources
  - [x] 2.6 Test endpoint manually using API client (e.g., Postman, Thunder Client)

- [x] 3. Backend API - Enhanced Delete Endpoint
  - [x] 3.1 Update DELETE handler in `app/api/projects/[id]/user-stories/[storyId]/route.ts`
  - [x] 3.2 Replace direct delete query with RPC call to `delete_user_story_with_cascade` function
  - [x] 3.3 Parse and format the cascade deletion statistics from function response
  - [x] 3.4 Update success response to include cascade deletion counts
  - [x] 3.5 Add enhanced error handling for transaction failures
  - [x] 3.6 Test cascade deletion with stories that have and don't have dependencies

- [x] 4. Frontend Data Layer - Dependency Check Hook
  - [x] 4.1 Add `useUserStoryJourneyMapDependencies` hook to `lib/hooks/use-user-stories.ts`
  - [x] 4.2 Implement query function to fetch journey map dependencies from new API endpoint
  - [x] 4.3 Configure proper React Query cache keys and options
  - [x] 4.4 Add TypeScript types for dependency response data
  - [x] 4.5 Test hook with React Query DevTools to verify caching behavior

- [x] 5. Frontend UI - Enhanced Delete Dialog Component
  - [x] 5.1 Update delete dialog state management in `app/projects/[projectId]/user-stories/page.tsx`
  - [x] 5.2 Add dependency data fetching when delete dialog opens using new hook
  - [x] 5.3 Create journey map dependency warning section component
  - [x] 5.4 Implement scrollable list of affected journey maps with titles and dates
  - [x] 5.5 Add navigation links to journey maps using Next.js Link (open in new tab)
  - [x] 5.6 Update dialog description with cascade deletion warning text
  - [x] 5.7 Conditionally render warning section only when dependencies exist
  - [x] 5.8 Update delete button text to show cascade count ("Delete Story & X Journey Map(s)")

- [x] 6. Frontend UI - Styling and UX Polish
  - [x] 6.1 Add ExternalLink icons from lucide-react next to journey map links
  - [x] 6.2 Style journey map list with proper spacing, fonts, and colors
  - [x] 6.3 Implement max-height constraint (300px) with scroll for long lists
  - [x] 6.4 Add loading state while fetching dependencies (skeleton or spinner)
  - [x] 6.5 Style warning text with alert-destructive styling
  - [x] 6.6 Add hover effects for clickable journey map links
  - [x] 6.7 Test responsive design on different screen sizes
  - [x] 6.8 Verify accessibility (keyboard navigation, screen reader support)

- [ ] 7. Integration Testing and Quality Assurance
  - [ ] 7.1 Test complete flow: delete story with no dependencies (standard flow)
  - [ ] 7.2 Test complete flow: delete story with 1 journey map dependency
  - [ ] 7.3 Test complete flow: delete story with multiple journey map dependencies
  - [ ] 7.4 Verify journey map navigation links open correct pages in new tabs
  - [ ] 7.5 Test error scenarios (API failures, network issues, unauthorized access)
  - [ ] 7.6 Verify database integrity after cascade deletions (no orphaned records)
  - [ ] 7.7 Test concurrent deletion attempts and transaction rollback behavior
  - [ ] 7.8 Run full application build and verify no TypeScript or lint errors
