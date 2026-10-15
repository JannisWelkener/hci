# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-11-22-user-story-cascade-deletion/spec.md

## Technical Requirements

### Frontend Requirements

- **Dependency Check Hook**: Create a new React Query hook `useUserStoryDependencies(projectId, storyId)` that fetches journey map dependencies for a given user story
  - Should return: `{ journeyMaps: Array<{ id, title, created_at }>, hasDependencies: boolean, isLoading: boolean }`
  - Cache results with appropriate query keys for performance

- **Enhanced Delete Dialog Component**: Modify the existing delete AlertDialog in `app/projects/[projectId]/user-stories/page.tsx` (lines 203-221)
  - Add conditional warning section that displays when dependencies exist
  - Show a scrollable list of affected journey maps (max-height with overflow)
  - Each journey map entry should be a clickable link that opens the journey map page in a new tab
  - Display journey map title and creation date for each entry
  - Update dialog description to include cascade deletion warning text

- **State Management**: Update the delete confirmation flow to:
  - Fetch dependencies when delete dialog opens (triggered by `showDeleteDialog` state change)
  - Pass dependency data to the delete mutation
  - Show loading state while fetching dependencies
  - Handle error states if dependency check fails

- **Navigation Links**: Journey map links should use Next.js Link component with `target="_blank"` to open in new tab
  - Format: `/projects/{projectId}/user-journey-maps/{journeyMapId}`
  - Style as clickable links with hover effects (use Tailwind text-primary hover:underline)

### Backend Requirements

- **Dependency Check Endpoint**: Create new GET endpoint `/api/projects/[id]/user-stories/[storyId]/journey-map-dependencies`
  - Query `user_journey_map_timeline` table for entries matching `user_story_id`
  - Join with `user_journey_maps` table to get full journey map details
  - Return array of journey map objects with id, title, created_at fields
  - Implement proper authentication and authorization checks (RLS policies)

- **Cascade Delete Logic**: Modify existing DELETE endpoint in `app/api/projects/[id]/user-stories/[storyId]/route.ts` (lines 143-174)
  - Wrap deletion in a Supabase transaction to ensure atomicity
  - Query all journey maps that reference this user story via `user_journey_map_timeline`
  - Delete all `user_journey_map_timeline` entries for this story
  - Delete all affected `user_journey_maps` records
  - Finally delete the `user_story` record
  - If any step fails, rollback entire transaction
  - Return success response with count of deleted journey maps

- **Error Handling**: Implement comprehensive error handling
  - Handle database constraint violations gracefully
  - Return appropriate HTTP status codes (404, 500, 403)
  - Log errors for debugging without exposing sensitive data to client

### Performance Requirements

- **Query Optimization**: Use database joins instead of multiple queries to fetch dependencies
  - Single query should fetch all necessary journey map data
  - Add appropriate indexes on `user_journey_map_timeline.user_story_id` if not exists

- **Transaction Management**: Ensure cascade delete completes within 5 seconds for typical datasets
  - Use Supabase's built-in transaction support
  - Consider batch deletion for large datasets (though unlikely in typical use)

### UI/UX Requirements

- **Loading States**: Show skeleton or spinner while fetching dependencies before showing delete dialog
- **Empty State**: When no dependencies exist, show standard delete confirmation without warning section
- **List Display**: For journey maps list in warning dialog:
  - Display in a card-like format with proper spacing
  - Show journey map title prominently (text-base font-semibold)
  - Show creation date in smaller text (text-sm text-muted-foreground)
  - Use lucide-react icons (ExternalLink icon) next to links to indicate they open in new tab
  - Limit list height to 300px with scroll if more than ~4 journey maps

- **Warning Text**: Use alert-destructive styling for the cascade deletion warning
  - Example: "Warning: Deleting this user story will also permanently delete the following journey maps that reference it:"

- **Confirmation Button**: Update delete button text when dependencies exist
  - Change from "Delete" to "Delete Story & {count} Journey Map(s)"
  - Maintain destructive styling (red background)

## External Dependencies

No new external dependencies are required. This feature uses existing libraries and frameworks:
- **TanStack Query (React Query)**: Already in use for data fetching hooks
- **Next.js Link**: Built-in navigation component
- **shadcn/ui AlertDialog**: Already in use for delete confirmations
- **Supabase Client**: Already configured for database operations
