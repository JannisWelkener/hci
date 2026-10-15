# Spec Tasks

## Tasks

- [ ] 1. Database Schema Migration
  - [ ] 1.1 Create migration script to add new columns (description, priority_order, generation_method, dependencies)
  - [ ] 1.2 Create database indexes for performance (priority_order, dependencies GIN index)
  - [ ] 1.3 Write backfill script to populate priority_order from existing data
  - [ ] 1.4 Create rollback migration script
  - [ ] 1.5 Test migration on development database
  - [ ] 1.6 Verify indexes are created and used in query plans

- [ ] 2. Update Type Definitions and Validation Schemas
  - [ ] 2.1 Update UserStory type in database types to include new fields
  - [ ] 2.2 Add dependency types (Dependency, DependencyType, GenerationMethod)
  - [ ] 2.3 Update Zod validation schemas (createUserStorySchema, updateUserStorySchema)
  - [ ] 2.4 Create new validation schemas (generateUserStorySchema, reorderUserStoriesSchema)
  - [ ] 2.5 Write unit tests for validation schemas
  - [ ] 2.6 Verify TypeScript compilation passes

- [ ] 3. API Endpoints - Core Updates
  - [ ] 3.1 Write tests for updated GET /api/projects/[id]/user-stories endpoint
  - [ ] 3.2 Update GET endpoint to return new fields (description, priority_order, dependencies, generation_method)
  - [ ] 3.3 Update POST endpoint to accept and validate new fields
  - [ ] 3.4 Update PATCH endpoint to handle new fields
  - [ ] 3.5 Update query logic to support priority_order sorting
  - [ ] 3.6 Add dependency validation (no self-references, valid story IDs)
  - [ ] 3.7 Verify all tests pass

- [ ] 4. API Endpoints - New Features
  - [ ] 4.1 Write tests for POST /api/projects/[id]/user-stories/generate endpoint
  - [ ] 4.2 Create mock AI story generator service (lib/services/ai-story-generator.ts)
  - [ ] 4.3 Implement generate endpoint with mock AI integration
  - [ ] 4.4 Write tests for PATCH /api/projects/[id]/user-stories/reorder endpoint
  - [ ] 4.5 Implement bulk reorder endpoint with transaction support
  - [ ] 4.6 Write tests for GET /api/projects/[id]/user-stories/[storyId]/dependencies endpoint
  - [ ] 4.7 Implement dependencies endpoint with bidirectional lookup
  - [ ] 4.8 Verify all tests pass

- [ ] 5. React Query Hooks Updates
  - [ ] 5.1 Update useUserStories hook to fetch new fields
  - [ ] 5.2 Update useCreateUserStory hook to send new fields
  - [ ] 5.3 Update useUpdateUserStory hook to handle new fields
  - [ ] 5.4 Create useGenerateAIStory hook for AI generation
  - [ ] 5.5 Create useUpdateStoryOrder hook for bulk reordering
  - [ ] 5.6 Create useStoryDependencies hook for fetching related stories
  - [ ] 5.7 Add optimistic updates for reorder operations
  - [ ] 5.8 Test hooks with mock API responses

- [ ] 6. Install and Configure Dependencies
  - [ ] 6.1 Install @tanstack/react-table package
  - [ ] 6.2 Install @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities packages
  - [ ] 6.3 Verify package installations and peer dependencies
  - [ ] 6.4 Run npm run build to ensure no conflicts
  - [ ] 6.5 Update package.json and verify lock file

- [ ] 7. TanStack Table Implementation
  - [ ] 7.1 Create UserStoriesTable.tsx component with basic table structure
  - [ ] 7.2 Define column definitions (title, role, priority, status, story_points, dependencies, actions)
  - [ ] 7.3 Implement sorting functionality for all columns
  - [ ] 7.4 Add pagination controls with configurable page sizes
  - [ ] 7.5 Implement column visibility toggles
  - [ ] 7.6 Add responsive design (hide columns on mobile)
  - [ ] 7.7 Style table with Tailwind CSS and shadcn/ui components
  - [ ] 7.8 Test table with mock data and verify functionality

- [ ] 8. Drag-and-Drop Priority Reordering
  - [ ] 8.1 Set up DndContext and SortableContext in UserStoriesTable
  - [ ] 8.2 Create SortableRow component with useSortable hook
  - [ ] 8.3 Implement drag handle UI with visual indicators
  - [ ] 8.4 Add DragOverlay for visual feedback during drag
  - [ ] 8.5 Configure touch and mouse sensors for cross-device support
  - [ ] 8.6 Implement onDragEnd handler to calculate new priority_order values
  - [ ] 8.7 Integrate with useUpdateStoryOrder hook for API updates
  - [ ] 8.8 Add optimistic UI updates and error handling
  - [ ] 8.9 Test drag-and-drop on desktop and mobile devices

- [ ] 9. Dependency Management Components
  - [ ] 9.1 Create DependencySelector.tsx component with search/multi-select
  - [ ] 9.2 Implement story search functionality within DependencySelector
  - [ ] 9.3 Add dependency type selection (blocks, requires, relates_to)
  - [ ] 9.4 Create DependencyBadge component for table view display
  - [ ] 9.5 Implement dependency popover with details on hover/click
  - [ ] 9.6 Add dependency validation (prevent self-references)
  - [ ] 9.7 Create DependencyList component for detail view
  - [ ] 9.8 Test dependency management flow end-to-end

- [ ] 10. AI Generation Toggle and Form Enhancement
  - [ ] 10.1 Create GenerationModeToggle.tsx component with manual/AI modes
  - [ ] 10.2 Update UserStoryForm.tsx to integrate mode toggle
  - [ ] 10.3 Implement conditional rendering for manual fields vs AI description
  - [ ] 10.4 Add description textarea (always visible in both modes)
  - [ ] 10.5 Integrate mock AI generation with loading states
  - [ ] 10.6 Add "Generate Story" button with error handling
  - [ ] 10.7 Allow editing of AI-generated fields
  - [ ] 10.8 Update form validation for both modes
  - [ ] 10.9 Test mode switching and form submission for both modes

- [ ] 11. Description Field Integration
  - [ ] 11.1 Add description display to UserStoryCard component
  - [ ] 11.2 Create description tooltip/icon for table view
  - [ ] 11.3 Add description section to UserStoryDetail component
  - [ ] 11.4 Implement markdown rendering for description (optional)
  - [ ] 11.5 Add character count indicator in form
  - [ ] 11.6 Test description field in all views

- [ ] 12. Page Integration and User Flows
  - [ ] 12.1 Replace UserStoriesList with UserStoriesTable in page.tsx
  - [ ] 12.2 Wire up all table interactions (sort, filter, pagination, reorder)
  - [ ] 12.3 Update create dialog to use enhanced form with toggle
  - [ ] 12.4 Update edit dialog to support all new fields
  - [ ] 12.5 Test complete user flows (create with AI, create manually, reorder, add dependencies)
  - [ ] 12.6 Verify mobile responsiveness across all views
  - [ ] 12.7 Add keyboard navigation support
  - [ ] 12.8 Test accessibility with screen reader

- [ ] 13. Quality Assurance and Finalization
  - [ ] 13.1 Run full test suite (npm run test if configured)
  - [ ] 13.2 Run TypeScript compilation (npm run build)
  - [ ] 13.3 Run ESLint (npm run lint) and fix any warnings
  - [ ] 13.4 Test with various data scenarios (empty state, 1 story, 100+ stories)
  - [ ] 13.5 Verify performance (no lag during drag-drop or table operations)
  - [ ] 13.6 Test error handling (API failures, validation errors)
  - [ ] 13.7 Verify database migration works on production-like environment
  - [ ] 13.8 Create documentation for new features (optional)
  - [ ] 13.9 Final review and cleanup of code comments

## Task Dependencies

- **Task 1** must complete before Tasks 2-5 (database schema needed for types/API)
- **Task 2** must complete before Tasks 3-5 (types needed for API and hooks)
- **Tasks 3-4** must complete before Task 5 (API endpoints needed for hooks)
- **Task 5** must complete before Tasks 7-11 (hooks needed for components)
- **Task 6** must complete before Tasks 7-8 (packages needed for table and drag-drop)
- **Tasks 7-11** must complete before Task 12 (components needed for integration)
- **Task 12** must complete before Task 13 (integration needed for final QA)

## Estimated Complexity

- **High Complexity**: Tasks 7, 8 (TanStack Table and Drag-and-Drop require careful integration)
- **Medium Complexity**: Tasks 3, 4, 9, 10, 12 (API updates, dependency management, form enhancement)
- **Low Complexity**: Tasks 1, 2, 5, 6, 11, 13 (Straightforward migrations, type updates, QA)

## Notes

- Follow TDD approach where possible (write tests first for new endpoints/functions)
- Use optimistic updates for smooth UX (especially for drag-drop)
- Maintain backward compatibility (existing API clients should continue to work)
- Mock AI integration in Task 4 is prepared for easy OpenAI replacement in future
- Database migration should be reversible (rollback script included)
