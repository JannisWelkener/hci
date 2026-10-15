# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-12-06-user-story-priority-cleanup/spec.md

## Technical Requirements

### Priority Ordering Changes

**Frontend - UserStoriesTable.tsx**
- Modify `handleDragEnd` function to calculate sequential priority_order values (1, 2, 3...) instead of using 1000-increment gaps
- Update calculation logic from `(index + 1) * 1000` to `(index + 1)`
- Ensure drag-and-drop still supports inserting stories between existing positions
- Update any UI display logic that might reference priority_order values

**Frontend - React Query Hook (use-user-stories.ts)**
- Modify `useUpdateStoryOrder` mutation to handle sequential priority_order values
- Ensure optimistic updates correctly reflect the new sequential numbering
- Verify cache invalidation still works correctly after reordering

**Backend - Reorder API Route**
- Update `/api/projects/[id]/user-stories/reorder/route.ts` to accept and validate sequential priority_order values
- Ensure bulk update logic handles sequential values correctly
- Maintain transaction integrity for multi-story updates

**Backend - Create API Route**
- Modify `/api/projects/[id]/user-stories/route.ts` auto-calculation logic for new stories
- Change from `maxPriorityOrder + 1000` to `maxPriorityOrder + 1`
- Ensure new stories are appended to the end with the next sequential number

### Form Field Removal

**Frontend - UserStoryFormEnhanced.tsx**
- Remove description field rendering when `generationMode === 'manual'`
- Keep description field visible and required when `generationMode === 'ai'`
- Update form schema/validation to make description optional for manual mode
- Ensure form submission doesn't send description field when in manual mode
- Update TypeScript types to reflect optional description in manual mode

**Frontend - Form Validation (user-story.ts)**
- Update Zod schema to conditionally require description only for AI generation
- Create separate schemas for manual vs AI creation if needed
- Ensure validation errors don't reference description field in manual mode

### Database Consistency

**Migration Script**
- Create a data migration to renumber existing priority_order values to sequential format
- Use a SQL query to update all user stories per project, ordered by current priority_order
- Ensure zero-downtime migration with proper transaction handling
- Include rollback capability to restore original priority_order values if needed

**Data Integrity**
- Verify no gaps in priority_order sequences after migration
- Ensure all projects have stories starting from 1 and incrementing by 1
- Handle edge cases: projects with no stories, single story projects, deleted stories

### UI/UX Considerations

**Visual Updates**
- No changes to drag-and-drop handle visual appearance
- No changes to table column headers or sorting functionality
- Priority_order column (if visible) should display clean sequential numbers
- Ensure no visual glitches during drag-and-drop with new numbering

**User Feedback**
- Drag-and-drop should feel the same to users (same visual feedback)
- Form should not show removed description field in manual mode
- No error messages or validation issues related to removed description field

### Performance

**Reordering Performance**
- Sequential numbering should not impact drag-and-drop performance
- Bulk update query should complete in same timeframe as current implementation
- Optimistic updates should feel instant to users
- No degradation in table rendering or sorting speed

**Database Performance**
- Index on priority_order column should remain effective with sequential values
- Query performance for fetching ordered stories should not change
- Bulk update transaction should be fast enough for real-time UX

### Error Handling

**Validation Errors**
- Ensure API validates that all priority_order values in reorder request are positive integers
- Handle cases where priority_order values have gaps or duplicates
- Return clear error messages if reorder operation fails
- Frontend should handle reorder failures gracefully with rollback

**Form Errors**
- Manual mode should not show validation errors for missing description
- AI mode should continue to require description with appropriate error message
- Form submission should succeed without description in manual mode
