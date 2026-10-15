# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-11-12-user-stories-enhancement/spec.md

## Technical Requirements

### 1. TanStack Table Implementation

- **Component**: Create `UserStoriesTable.tsx` component using `@tanstack/react-table` v8.x
- **Features**:
  - Column definitions for: title, user_role, priority, status, story_points, dependencies (count badge), description (icon/tooltip), actions
  - Sortable columns with multi-column sorting support
  - Column visibility toggles (allow users to show/hide columns)
  - Pagination with configurable page sizes (10, 25, 50, 100)
  - Global search/filter functionality
  - Row selection (for future bulk operations)
  - Responsive column hiding on mobile (<768px: hide description, story_points, user_role)
- **Styling**: Use Tailwind CSS classes and shadcn/ui table components for consistency
- **Performance**: Implement virtualization for large datasets (>100 stories) using TanStack Virtual

### 2. Drag-and-Drop Priority Reordering

- **Library**: `@dnd-kit/core` v6.x and `@dnd-kit/sortable` v8.x
- **Implementation**:
  - Wrap table rows with `SortableContext` and `useSortable` hook
  - DragOverlay component for visual feedback during drag
  - Touch sensor and mouse sensor configuration for mobile/desktop support
  - Collision detection algorithm: closestCenter
- **State Management**:
  - Optimistic updates using TanStack Query's `onMutate` callback
  - Calculate new `priority_order` values on drop (gap of 1000 between items for easy reordering)
  - Batch update API call with new order for all affected stories
- **UX Requirements**:
  - Smooth animations (150ms transition)
  - Visual drag handle icon on hover
  - Disabled state during drag (prevent other interactions)
  - Success/error toast notifications
  - Rollback on API failure

### 3. Dependency Management

- **Data Structure**: JSONB array in database storing dependency objects
  ```typescript
  type Dependency = {
    story_id: string;
    type: 'blocks' | 'requires' | 'relates_to';
  };
  dependencies: Dependency[];
  ```
- **UI Components**:
  - `DependencySelector.tsx`: Multi-select combobox using shadcn/ui Command component
  - Search functionality to find stories by title
  - Display selected dependencies with type badges and remove buttons
  - In table view: Badge showing dependency count with popover showing details
- **Validation**:
  - Frontend validation: Prevent self-dependencies
  - Display warning if circular dependencies detected (optional enhancement)
- **Performance**: Fetch related stories in parallel using Promise.all when viewing details

### 4. AI Generation Toggle

- **Component**: `GenerationModeToggle.tsx` with clear visual states
- **Modes**:
  - **Manual Mode** (default): Show user_role, action, benefit text inputs
  - **AI Mode**: Show description textarea with "Generate Story" button
- **Mock AI Service**:
  - Create `lib/services/ai-story-generator.ts` with mock implementation
  - Function signature: `generateUserStory(description: string): Promise<GeneratedStory>`
  - Mock returns plausible story based on simple text patterns
  - Add 500ms delay to simulate API call
  - Structure prepared for easy OpenAI integration (comment placeholders)
- **UX Flow**:
  - Toggle animation with sliding effect
  - Loading spinner during generation
  - Error handling with retry option
  - Editable generated fields (allow manual refinement)
  - Store `generation_method` enum in database

### 5. Description Field Integration

- **Database**: Add `description` TEXT column (nullable)
- **Form Integration**:
  - Always visible textarea regardless of mode
  - In AI mode: Primary input (required)
  - In manual mode: Optional context field
  - Character limit: 2000 characters
  - Markdown support for rich formatting (display only)
- **Display**:
  - Table view: Icon with tooltip showing truncated description (100 chars)
  - Detail view: Full description in dedicated section with markdown rendering
  - Card view (mobile): Show description preview below title

### 6. Priority Order System

- **Database**: Add `priority_order` INTEGER column
- **Calculation Logic**:
  - Initial order: Assign based on created_at timestamp * 1000
  - On drag-drop: Calculate new value as average of surrounding items
  - Periodic rebalancing: When values get too close (<10 gap), reassign with 1000 gaps
- **Sorting**: Default sort by `priority_order ASC` (drag order), secondary by `created_at DESC`
- **Migration**: Auto-calculate for existing stories based on current priority level and created_at

### 7. Enhanced Form Component

- **Updates to `UserStoryForm.tsx`**:
  - Add GenerationModeToggle at top of form
  - Conditional rendering of manual fields vs AI description based on mode
  - Integrate DependencySelector component
  - Add description textarea (always visible)
  - Update Zod schema to validate new fields
  - Handle mode switching with form state preservation
- **Validation Schema Updates**:
  - Manual mode: user_role, action, benefit required
  - AI mode: description required (min 10 characters)
  - Dependencies: optional array of dependency objects
  - Description: optional, max 2000 characters
  - Generation method: enum validation

### 8. Mobile Responsiveness

- **Table Adaptations**:
  - Column hiding on small screens (<768px)
  - Horizontal scroll for remaining columns
  - Touch-optimized row height (min 60px)
  - Larger drag handles (48px touch target)
- **Drag-and-Drop**:
  - PointerSensor for unified mouse/touch handling
  - Prevent scroll-during-drag on mobile
  - Visual feedback optimized for touch (larger overlay)
- **Form Layout**:
  - Stack form fields vertically on mobile
  - Full-width inputs
  - Sticky action buttons at bottom

### 9. State Management & Caching

- **TanStack Query Hooks**:
  - `useUserStories`: Existing hook, update to fetch new fields
  - `useUpdateStoryOrder`: New hook for batch priority_order updates
  - `useGenerateAIStory`: New hook for AI generation (mock)
  - `useStoryDependencies`: New hook for fetching related stories
- **Cache Invalidation**:
  - Invalidate list queries after: create, update, delete, reorder
  - Optimistic updates for all mutations
  - Stale time: 5 minutes for list, 10 minutes for details

### 10. Accessibility Requirements

- **Keyboard Navigation**:
  - Arrow keys for table navigation
  - Space/Enter to activate drag (keyboard-based reordering)
  - Tab order: table → pagination → filters → actions
- **Screen Readers**:
  - ARIA labels for all interactive elements
  - Live region announcements for drag-drop feedback
  - Table semantics (thead, tbody, th, td)
- **Focus Management**:
  - Visible focus indicators (2px outline)
  - Focus trap in dialog modals
  - Return focus after modal close

## External Dependencies

New packages required for this implementation:

### @tanstack/react-table
- **Version**: ^8.20.0 (latest stable)
- **Purpose**: Core table functionality with sorting, filtering, pagination, and column management
- **Justification**: Industry-standard table library for React with excellent TypeScript support, tree-shaking, and minimal bundle size (~25KB gzipped). Provides headless UI approach that integrates perfectly with shadcn/ui design system.

### @dnd-kit/core
- **Version**: ^6.1.0
- **Purpose**: Core drag-and-drop functionality with accessibility support
- **Justification**: Modern, performant drag-and-drop library built specifically for React. Provides excellent touch support, accessibility (keyboard navigation), and composable architecture. Smaller and more maintainable than deprecated alternatives (react-beautiful-dnd).

### @dnd-kit/sortable
- **Version**: ^8.0.0
- **Purpose**: Sortable list utilities and presets for @dnd-kit/core
- **Justification**: Official extension for sortable lists with optimized performance and smooth animations. Handles the complexity of reordering logic and provides strategies for different layout types.

### @dnd-kit/utilities (peer dependency)
- **Version**: ^3.2.2
- **Purpose**: Utility functions for @dnd-kit ecosystem
- **Justification**: Required peer dependency for coordinate calculations and transformation utilities.

### react-markdown (optional)
- **Version**: ^9.0.0
- **Purpose**: Render description field with markdown formatting
- **Justification**: Lightweight markdown renderer for React. Allows rich formatting in description field without security risks (sanitized by default). Optional for MVP, can be added later.

## Performance Considerations

- **Table Rendering**: Use `memo()` for table cell components to prevent unnecessary re-renders
- **Drag-and-Drop**: Debounce order updates (wait 300ms after drop before API call)
- **AI Generation**: Implement request cancellation for abandoned generation attempts
- **Dependency Loading**: Lazy load dependency details only when popover is opened
- **Bundle Size**: Code-split table components (load only when user navigates to user stories page)

## Testing Requirements

- **Unit Tests**: Zod schemas, utility functions, mock AI generator
- **Component Tests**: Table sorting/filtering, drag-drop logic, mode toggle
- **Integration Tests**: Form submission with both modes, dependency management
- **E2E Tests**: Complete user flows (create story, reorder, add dependencies)
- **Accessibility Tests**: Keyboard navigation, screen reader compatibility

## Migration Strategy

1. **Database Migration**: Run schema changes first (add columns with defaults)
2. **Data Migration**: Backfill priority_order for existing stories
3. **Feature Flag**: Optional - enable new table view behind feature flag for gradual rollout
4. **Fallback**: Keep existing list view code temporarily for rollback capability
5. **Documentation**: Update user guide with new features and workflows
