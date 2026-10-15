# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-12-07-user-story-dependency-cleanup/spec.md

## Technical Requirements

### 1. API Endpoint for Incoming Dependency Detection

- **Endpoint**: `GET /api/projects/[projectId]/user-stories/[storyId]/incoming-dependencies`
- **Purpose**: Fetch all user stories that reference the target story in their dependencies array
- **Query Logic**:
  - Fetch all user stories in the project
  - Filter stories where `dependencies` array contains an object with `story_id` matching the target story ID
  - Return full story objects with title, user_role, action, status, priority, and ID
  - Sort by priority order (high to low) and then by creation date
- **Response Format**: `{ dependencies: UserStory[], count: number }`
- **Performance**: Should handle up to 1000 stories efficiently using Supabase's JSONB query capabilities

### 2. React Query Hook for Incoming Dependencies

- **Hook Name**: `useUserStoryIncomingDependencies(projectId, storyId, options)`
- **Location**: `lib/hooks/use-user-stories.ts`
- **Behavior**:
  - Lazy-loaded (only fetches when deletion dialog opens)
  - Uses React Query caching with 30-second stale time
  - Follows existing pattern from `useUserStoryJourneyMapDependencies`
  - Enables/disables based on dialog open state to prevent unnecessary requests
- **Return Type**: `{ data: { dependencies: UserStory[], count: number }, isLoading, error }`

### 3. Deletion Dialog UI Enhancement

- **Components to Update**:
  - `components/features/user-stories/UserStoryDetail.tsx` (lines 311-409)
  - `app/projects/[projectId]/user-stories/page.tsx` (lines 246-343)
- **UI Requirements**:
  - Display incoming story dependencies in a section below journey map dependencies (if any)
  - Use consistent visual design with journey map warnings:
    - Warning icon and heading: "This will update dependencies"
    - Scrollable container (max height 300px)
    - Each story item shows:
      - Story title with user role and action
      - Status badge (colored based on status: To Do, In Progress, Done, Blocked)
      - Priority badge (colored based on priority: High, Medium, Low)
      - External link icon to view story in new tab
  - Dependency count displayed in warning message: "The following X stories depend on this story and will have their dependency references removed:"

### 4. Dynamic Button Text Logic

- **Current Pattern** (Journey Maps only): "Delete Story & X Journey Maps"
- **New Pattern** (Multiple dependency types):
  - No dependencies: "Delete Story"
  - Journey maps only: "Delete Story & X Journey Maps"
  - Story dependencies only: "Delete Story & Update X Dependencies"
  - Both types: "Delete Story & X Journey Maps & Update Y Dependencies"
- **Implementation**: Calculate total counts from both hooks and conditionally build button text string
- **Loading State**: Show "Delete Story..." while dependency data is loading

### 5. Server-Side Dependency Cleanup

- **Location**: `app/api/projects/[projectId]/user-stories/[storyId]/route.ts` (DELETE handler)
- **Current Flow**:
  1. Verify story exists and belongs to project
  2. Call `delete_user_story_with_cascade()` RPC function
  3. Return deletion statistics
- **Enhanced Flow**:
  1. Verify story exists and belongs to project
  2. Fetch all incoming dependencies (stories referencing this story)
  3. For each dependent story, update its `dependencies` array to remove objects where `story_id` matches the deleted story
  4. Call `delete_user_story_with_cascade()` RPC function
  5. Return enhanced deletion statistics including `dependenciesUpdated: number`
- **Transaction Safety**: All operations must occur within a Supabase transaction to ensure atomicity
- **Error Handling**: If dependency cleanup fails, roll back the entire deletion

### 6. Response Format Update

- **Current Response**:
```typescript
{
  success: true,
  deleted: {
    story: true,
    journeyMaps: number,
    timelineEntries: number
  }
}
```
- **Enhanced Response**:
```typescript
{
  success: true,
  deleted: {
    story: true,
    journeyMaps: number,
    timelineEntries: number,
    dependenciesUpdated: number
  }
}
```

### 7. Performance Considerations

- **Batch Updates**: Use Supabase's bulk update capabilities to update all dependent stories in a single query
- **JSONB Operations**: Utilize PostgreSQL's JSONB array manipulation functions for efficient reference removal
- **Caching**: Invalidate React Query cache for:
  - User stories list
  - Individual story details
  - Dependency queries
  - Journey map queries (existing)
- **Loading States**: Show loading indicators while fetching dependency data to prevent UI freezing

### 8. UI/UX Specifications

- **Typography**: Match existing deletion dialog typography (text-sm for body, text-xs for metadata)
- **Spacing**: Use consistent padding (p-4) and gaps (gap-2, gap-3) with existing components
- **Colors**:
  - Warning section: `bg-amber-50 border-amber-200` (light mode)
  - Status badges: Use existing status color mapping
  - Priority badges: Use existing priority color mapping
- **Icons**:
  - Use `AlertTriangle` from lucide-react for warning header
  - Use `ExternalLink` from lucide-react for view story links
- **Accessibility**:
  - Proper ARIA labels for links
  - Keyboard navigation support
  - Screen reader announcements for dependency counts
  - Focus management when opening external story links

### 9. Edge Cases to Handle

- **No Incoming Dependencies**: Show only journey map warnings (existing behavior)
- **Only Incoming Dependencies**: Show only story dependency warnings (no journey maps section)
- **Empty Project**: Handle case where no other stories exist
- **Circular Dependencies**: Display correctly (Story A depends on B, B depends on A - both should show in each other's warnings)
- **Multiple Dependency Types**: Single story may reference the deleted story multiple times with different types - deduplicate and show count
- **Deleted Story Has No Dependencies**: Standard deletion flow with warnings only

### 10. Testing Requirements

- **Unit Tests**: Test dependency detection logic with various scenarios
- **Integration Tests**: Test full deletion flow with dependency cleanup
- **UI Tests**: Test dialog rendering with different dependency combinations
- **Performance Tests**: Test with projects containing 100+ stories
- **Error Tests**: Test rollback behavior when cleanup fails
