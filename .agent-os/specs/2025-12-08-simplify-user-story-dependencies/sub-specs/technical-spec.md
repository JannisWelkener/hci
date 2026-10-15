# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-12-08-simplify-user-story-dependencies/spec.md

## Technical Requirements

### Type System Changes

**File:** `lib/types/database.ts`

- Remove `DependencyType` type export (line 103)
- Remove `Dependency` interface (lines 105-108)
- Update `UserStory` interface: change `dependencies: Dependency[]` to `dependencies: string[]` (line 124)
- Update Database type definitions for user_stories Insert/Update operations

### Validation Schema Changes

**File:** `lib/validations/user-story.ts`

- Remove `dependencyTypeSchema` (line 13)
- Remove `dependencySchema` object definition (lines 16-19)
- Update `createUserStorySchema.dependencies` from `z.array(dependencySchema)` to `z.array(z.string().uuid())` (lines 75-77)
- Update `updateUserStorySchema.dependencies` similarly (line 137)

### UI Component Updates

**File:** `components/features/user-stories/DependencySelector.tsx`

- Remove `DependencyType` import (line 37)
- Remove `dependencyTypeLabels` constant (lines 49-53)
- Remove `dependencyTypeDescriptions` constant (lines 55-59)
- Remove `selectedType` state (line 69)
- Remove dependency type selector UI (lines 128-169)
- Update `handleAddDependency` to push simple story ID string instead of object (lines 79-86)
- Remove `handleUpdateDependencyType` function (lines 92-99)
- Update dependency list rendering to remove type display and selector (lines 210-263)
- Change value prop type from `Dependency[]` to `string[]`
- Update `onChange` callback type from `(dependencies: Dependency[]) => void` to `(dependencies: string[]) => void`

**File:** `components/features/user-stories/DependencyList.tsx`

- Remove `DependencyType` import (line 8)
- Remove `dependencyTypeLabels` constant (lines 30-34)
- Remove `dependencyTypeIcons` constant (lines 36-40)
- Update props interfaces: change `type: DependencyType` to remove type field (lines 18-25)
- Remove type-based icon rendering (line 97, 123)
- Remove dependency type badge/label display (line 172)
- Simplify to show only story information without type classification

**File:** `components/features/user-stories/DependencyBadge.tsx`

- Remove `DependencyType` import (line 10)
- Remove `dependencyTypeColors` constant (lines 18-22)
- Remove `dependencyTypeLabels` constant (lines 24-28)
- Update `dependencies` prop type from `Dependency[]` to `string[]`
- Update rendering to show dependencies without type information (lines 104-107)
- Remove type-based color coding

### Form Component Updates

**File:** `components/features/user-stories/UserStoryForm.tsx` and `UserStoryFormEnhanced.tsx`

- Update form state type for dependencies from `Dependency[]` to `string[]`
- Update form field handling to work with string array instead of object array
- Simplify dependency-related form logic

### API Endpoint Updates

**File:** `app/api/projects/[id]/user-stories/[storyId]/dependencies/route.ts`

- Update `DependencyResponse` interface to remove type field from outgoing/incoming arrays
- Update response building logic to only include story objects without type (lines 84-90, 105-122)
- Simplify to return `{ story: UserStory }[]` instead of `{ story: UserStory, type: DependencyType }[]`

### Database Schema Considerations

- Current JSONB structure allows flexible schema changes
- No database constraints enforce dependency type values
- Migration will transform existing data in-place

## Performance Considerations

- **Reduced Data Size:** Removing type field reduces JSONB storage size by ~30-40% per dependency
- **Simpler Queries:** No need to filter or process type field in application code
- **Faster Rendering:** UI components render faster without type-based conditional logic
- **Index Impact:** GIN index on dependencies JSONB remains effective with simplified structure

## Error Handling

- Validation errors should return clear messages for invalid UUIDs in dependency array
- Handle cases where referenced story IDs no longer exist (orphaned dependencies)
- Maintain existing error handling for duplicate dependencies in array

## Testing Requirements

- Verify all user story forms accept and save string array dependencies
- Confirm dependency display components render correctly without type information
- Test API endpoints return simplified dependency responses
- Validate migration successfully transforms existing data
- Ensure TypeScript compilation succeeds with updated types
- Verify no runtime errors in dependency-related components

## Rollback Strategy

If issues arise:
1. Database rollback migration available to restore type field
2. Git revert commits to restore code changes
3. Type field can be re-added without data loss (all story_id references preserved)
