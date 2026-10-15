# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-11-16-user-story-dependencies-fix/spec.md

## Technical Requirements

### 1. DependencySelector Search Implementation

**Location:** `components/features/user-stories/DependencySelector.tsx`

**Current Issue:** The `CommandInput` component at line 170 does not filter the `CommandItem` components because the `value` prop on `CommandItem` (line 177) is set to `story.id` (a UUID), which doesn't match the user's text search input.

**Solution:**
- Modify the `CommandItem` component's `value` prop to include searchable text instead of just the story ID
- Use a composite string value containing: `story.title`, `story.user_role`, and `story.action`
- The shadcn/ui Command component will automatically filter items based on fuzzy matching against this value
- Keep the `onSelect` handler using `story.id` for identifying which story was selected

**Implementation Details:**
```tsx
// Update CommandItem value to be searchable
<CommandItem
  key={story.id}
  value={`${story.title} ${story.user_role} ${story.action}`}
  onSelect={() => handleAddDependency(story.id)}
>
  {/* ... existing content ... */}
</CommandItem>
```

**Testing:**
- Verify search filters by story title
- Verify search filters by user role (e.g., "student")
- Verify search filters by action text
- Verify fuzzy matching works (partial matches)
- Verify no results shows "No story found" message

### 2. DependencyList Component Integration

**Location:** `components/features/user-stories/UserStoryDetail.tsx`

**Current Issue:** The component does not display dependencies at all. The `DependencyList` component exists but is never imported or rendered.

**Solution:**
- Import the `DependencyList` component from the user-stories index
- Add a new dependencies section after the main story `Card` component (around line 223, before the delete dialog)
- Fetch dependency data with proper story details using a new hook or API call
- Pass the fetched `outgoing` and `incoming` dependencies to the `DependencyList` component
- Implement the `onStoryClick` handler to navigate to the clicked story's detail page

**Component Structure:**
```tsx
// After the main story Card (line 223)
{/* Dependencies Section */}
<DependencyList
  story={story}
  outgoing={outgoingDependencies}
  incoming={incomingDependencies}
  isLoading={dependenciesLoading}
  onStoryClick={handleDependencyClick}
/>
```

**Navigation Handler:**
```tsx
const handleDependencyClick = (storyId: string) => {
  router.push(`/projects/${projectId}/user-stories/${storyId}`)
}
```

### 3. Dependency Data Fetching

**Location:** `lib/hooks/use-user-stories.ts` (new hook) or component-level fetch

**Current Situation:** User stories have a `dependencies` field which contains an array of `{ story_id: string, type: DependencyType }`, but the actual story details for each dependency need to be fetched separately.

**Solution Options:**

**Option A - Server-Side Join (Recommended):**
- Create a new API endpoint: `GET /api/projects/[id]/user-stories/[storyId]/dependencies`
- This endpoint returns full story objects for both outgoing and incoming dependencies
- Returns format:
```typescript
{
  outgoing: Array<{ story: UserStory, type: DependencyType }>,
  incoming: Array<{ story: UserStory, type: DependencyType }>
}
```

**Option B - Client-Side Resolution:**
- Fetch all user stories for the project using existing `useUserStories` hook
- Filter and map the dependencies client-side
- Less efficient for large projects but requires no backend changes

**Recommended Approach:** Start with Option B for faster implementation, then optimize to Option A if performance becomes an issue.

**Hook Implementation:**
```typescript
export function useStoryDependencies(projectId: string, story: UserStory) {
  const { data: allStories, isLoading: storiesLoading } = useUserStories(projectId)

  const dependencies = useMemo(() => {
    if (!allStories) return { outgoing: [], incoming: [] }

    // Outgoing: this story's dependencies
    const outgoing = story.dependencies?.map(dep => ({
      story: allStories.find(s => s.id === dep.story_id)!,
      type: dep.type
    })).filter(d => d.story) || []

    // Incoming: stories that depend on this one
    const incoming = allStories
      .filter(s => s.dependencies?.some(dep => dep.story_id === story.id))
      .map(s => ({
        story: s,
        type: s.dependencies!.find(dep => dep.story_id === story.id)!.type
      }))

    return { outgoing, incoming }
  }, [allStories, story])

  return { ...dependencies, isLoading: storiesLoading }
}
```

### 4. UI/UX Requirements

**Search Experience:**
- Real-time filtering as user types (no debounce needed, Command handles this)
- Case-insensitive matching
- Partial match support
- Clear visual feedback when no results found

**Dependencies Display:**
- Separate card component below main story details
- Clear visual grouping of outgoing vs incoming dependencies
- Display dependency type badges with appropriate colors (matches existing DependencyList styling)
- Show story title, user role, action preview for each dependency
- Display priority and status badges
- Hover states on clickable dependency items
- Loading skeleton while fetching dependencies

**Navigation:**
- Cursor changes to pointer on hover over dependency items
- Clicking anywhere on the dependency card navigates to that story
- Visual indication (external link icon) that items are clickable

### 5. Error Handling

**Search:**
- Handle case when no stories are available (already implemented: "No more stories available")
- Handle empty search results (already implemented: "No story found")

**Dependencies:**
- Handle case when story has no dependencies (DependencyList already handles this)
- Handle loading states gracefully with skeleton UI
- Handle missing dependency stories (filter out in client-side resolution)

### 6. Performance Considerations

- Memoize filtered dependencies calculation to avoid unnecessary recalculations
- Consider pagination if projects have 100+ user stories (not in scope for this spec)
- Lazy load dependency details only when viewing story detail page (not on list view)

## File Modifications Summary

1. **`components/features/user-stories/DependencySelector.tsx`**
   - Update `CommandItem` value prop to use searchable text instead of UUID

2. **`components/features/user-stories/UserStoryDetail.tsx`**
   - Import `DependencyList` component
   - Import `useRouter` from next/navigation (already imported)
   - Add dependency data fetching (new hook or inline logic)
   - Add `DependencyList` component to JSX
   - Implement navigation handler

3. **`lib/hooks/use-user-stories.ts`** (optional, recommended)
   - Add `useStoryDependencies` hook for cleaner separation of concerns

4. **`components/features/user-stories/index.ts`** (verify)
   - Ensure `DependencyList` is exported (likely already is)
