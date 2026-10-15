# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-12-17-notification-bell/spec.md

## Technical Requirements

### Component Architecture

- **NotificationBell Component** - Create a bell icon component using lucide-react's Bell icon with an orange badge overlay displaying notification count
- **Badge Logic** - Implement count calculation that excludes notifications where creator_id matches current user_id
- **Dropdown Integration** - Reuse existing dropdown/popover component from shadcn/ui for notification list display
- **Color Consistency** - Use existing orange color from project's Tailwind configuration for badge styling (maintain design system consistency)

### Data Fetching & State Management

- **TanStack Query Hook** - Create `useNotifications()` hook to fetch notifications on component mount using existing TanStack Query setup
- **Automatic Refresh** - Fetch fresh notification data when dashboard page loads/reloads (no manual refresh button needed)
- **User Context** - Access current user ID from authentication context to filter and calculate badge count
- **Project Membership Filter** - Query only notifications where user is a project member (join with project_members table)

### UI/UX Requirements

- **Header Placement** - Position bell icon in dashboard header navigation (top-right area, visible on all dashboard pages)
- **Badge Display** - Show orange circular badge with white text on top-right of bell icon when count > 0
- **Badge Count Calculation** - Count = total notifications from other users in user's projects (exclude own changes)
- **Notification Format** - Display as: "{User Name} created ({count}) Journey Map(s) in {Project Name}"
- **Dropdown Behavior** - Open dropdown below bell icon on click, close on outside click or item selection
- **Scrollable List** - Make notification list vertically scrollable with max height constraint
- **Empty State** - Show "No notifications yet" message when list is empty
- **Chronological Order** - Display notifications sorted by creation timestamp (newest first)

### Notification Display Logic

- **Show All Changes** - Display all notifications in dropdown list (including user's own changes)
- **Badge Exclusion** - Exclude user's own notifications from badge count only (they still appear in list)
- **Persistent History** - All notifications remain visible across sessions (no automatic clearing)
- **User Attribution** - Display creator's full name by joining with users/profiles table

### Integration Points

- **Dashboard Layout** - Integrate bell component into existing dashboard header/navigation component
- **Authentication** - Use Supabase Auth to get current user ID for filtering
- **Database Queries** - Use Supabase client for querying notifications and related data
- **Responsive Design** - Ensure bell icon and dropdown work properly on mobile/tablet screens using Tailwind responsive classes

### Performance Considerations

- **Query Optimization** - Use Supabase joins to fetch notifications with user/project data in single query
- **Cache Management** - Configure TanStack Query cache with appropriate staleTime to minimize redundant fetches
- **Pagination Consideration** - Initial implementation loads all notifications (add pagination if performance issues arise)
- **Index Requirements** - Ensure database indexes on user_id, project_id, and created_at columns for fast queries

### Accessibility

- **ARIA Labels** - Add aria-label="Notifications" to bell button
- **Badge Semantics** - Use aria-live="polite" for badge count updates
- **Keyboard Navigation** - Ensure dropdown is keyboard accessible (Tab, Enter, Escape keys)
- **Screen Reader Support** - Provide descriptive text for notification count and list items
