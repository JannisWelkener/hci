# Spec Tasks

## Tasks

- [x] 1. Database Schema & Migration Setup
  - [x] 1.1 Write migration file to create notifications table with all columns and constraints
  - [x] 1.2 Create indexes for user_id, creator_id, project_id, and composite queries
  - [x] 1.3 Implement Row-Level Security policies for notifications table
  - [x] 1.4 Create database trigger function to auto-generate notifications on journey_map INSERT
  - [x] 1.5 Test migration rollback and re-apply to ensure idempotency
  - [x] 1.6 Verify RLS policies prevent unauthorized access in Supabase dashboard

- [x] 2. Notification Data Layer & Hooks
  - [x] 2.1 Write tests for useNotifications hook (fetch, filter, count logic)
  - [x] 2.2 Create useNotifications TanStack Query hook with Supabase client integration
  - [x] 2.3 Implement unread count calculation (exclude creator_id = user_id)
  - [x] 2.4 Add joined queries for creator name and project name denormalization
  - [x] 2.5 Configure TanStack Query cache settings (staleTime, refetchOnMount)
  - [x] 2.6 Verify all hook tests pass with proper mocking

- [x] 3. NotificationBell Component
  - [x] 3.1 Write tests for NotificationBell component (rendering, badge count, dropdown behavior)
  - [x] 3.2 Create NotificationBell component with Bell icon from lucide-react
  - [x] 3.3 Implement orange badge overlay with dynamic count display
  - [x] 3.4 Add dropdown/popover integration using existing shadcn/ui component
  - [x] 3.5 Implement notification list rendering with proper formatting ("User X created (N) Journey Map(s) in Project Y")
  - [x] 3.6 Add empty state message ("No notifications yet")
  - [x] 3.7 Implement chronological sorting (newest first) and scrollable list styling
  - [x] 3.8 Add ARIA labels and keyboard navigation support for accessibility
  - [x] 3.9 Verify all component tests pass

- [x] 4. Dashboard Integration & Styling
  - [x] 4.1 Write integration tests for NotificationBell in dashboard header
  - [x] 4.2 Add NotificationBell to dashboard header/navigation layout component
  - [x] 4.3 Position bell icon in top-right area with responsive Tailwind classes
  - [x] 4.4 Verify orange badge color matches existing project color scheme (reuse existing Tailwind config)
  - [x] 4.5 Test responsive behavior on mobile, tablet, and desktop screen sizes
  - [x] 4.6 Verify all integration tests pass

- [x] 5. Journey Map Integration & Testing
  - [x] 5.1 Write end-to-end tests for notification creation when Journey Map is created
  - [x] 5.2 Verify database trigger creates notification rows for all project members (excluding creator)
  - [x] 5.3 Test badge count updates correctly on page refresh after Journey Map creation
  - [x] 5.4 Verify user's own Journey Map creations appear in list but don't increment badge
  - [x] 5.5 Test notification filtering (only shows notifications from projects user is member of)
  - [x] 5.6 Test notification persistence across logout/login sessions
  - [x] 5.7 Verify all end-to-end tests pass and build succeeds
