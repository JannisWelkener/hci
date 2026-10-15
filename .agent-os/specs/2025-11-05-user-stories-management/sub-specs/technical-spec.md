# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-11-05-user-stories-management/spec.md

## Technical Requirements

### Frontend Components

1. **UserStoriesList Component**
   - Display paginated list of user stories with title, priority badge, status badge, and story points
   - Implement sorting functionality (by priority, status, created_at)
   - Click handler to navigate to detail view
   - Empty state when no user stories exist
   - Loading and error states
   - Delete action with confirmation dialog

2. **UserStoryForm Component**
   - React Hook Form integration with Zod validation
   - Fields: title (max 200 chars), user_role (max 100 chars), action (max 500 chars), benefit (max 500 chars)
   - Priority dropdown (low, medium, high, critical)
   - Status dropdown (backlog, in_progress, done)
   - Story points number input (1-100, optional)
   - Dynamic acceptance criteria array with add/remove controls
   - Form validation with inline error messages
   - Support both create and edit modes

3. **AcceptanceCriteriaInput Component**
   - Dynamic field array using React Hook Form's useFieldArray
   - "+" button to add new criterion
   - Delete button for each criterion
   - Text input for each criterion (max 500 chars each)
   - Visual numbering/ordering of criteria

4. **UserStoryCard Component**
   - Display summary information (title, priority, status, story points)
   - Visual priority indicators (color-coded badges)
   - Status badges with appropriate colors
   - Click to view details

5. **UserStoryDetail Component**
   - Full display of all user story fields
   - Toggle between view and edit modes
   - Edit button to enable editing
   - Uses UserStoryForm component in edit mode
   - Display formatted user story: "As a [role], I want [action], so that [benefit]"
   - Numbered list display of acceptance criteria
   - Delete button with confirmation

### API Layer

1. **Data Fetching Hooks**
   - `useUserStories(projectId)` - Fetch all user stories for a project with TanStack Query
   - `useUserStory(id)` - Fetch single user story by ID
   - Query invalidation after mutations
   - Optimistic updates for better UX

2. **Mutation Hooks**
   - `useCreateUserStory()` - Create new user story
   - `useUpdateUserStory()` - Update existing user story
   - `useDeleteUserStory()` - Delete user story with cascade
   - Error handling with toast notifications
   - Success feedback with toast messages

### Validation Schemas

1. **User Story Zod Schema**
   ```typescript
   - title: string, 1-200 chars, required
   - user_role: string, 1-100 chars, required
   - action: string, 1-500 chars, required
   - benefit: string, 1-500 chars, required
   - acceptance_criteria: array of strings (each max 500 chars), optional
   - priority: enum (low, medium, high, critical), optional, default 'medium'
   - status: enum (backlog, in_progress, done), optional, default 'backlog'
   - story_points: number, 1-100, optional
   ```

### UI/UX Specifications

1. **List View Layout**
   - Responsive grid or table layout
   - Header with "New User Story" button (primary action)
   - Sort controls (dropdown or toggle buttons)
   - Each item shows: title, priority badge, status badge, story points
   - Hover states for interactive elements
   - Empty state with illustration and call-to-action

2. **Form Layout**
   - Modal dialog (using shadcn/ui Dialog) or dedicated page
   - Logical field grouping:
     - User Story fields (role, action, benefit)
     - Metadata fields (priority, status, story points)
     - Acceptance criteria section with dynamic list
   - Clear visual separation between sections
   - Helper text for each field
   - Validation feedback on submit

3. **Detail View Layout**
   - Card-based layout with sections
   - Formatted user story display: "As a [role], I want [action], so that [benefit]"
   - Metadata section (priority, status, story points) with visual indicators
   - Acceptance criteria displayed as numbered checklist
   - Action buttons: Edit, Delete, Back to List
   - Timestamps (created_at, updated_at) in footer

### Routing

- List view: `/projects/[projectId]/user-stories`
- Detail view: `/projects/[projectId]/user-stories/[storyId]`
- Create/Edit: Modal overlay or inline form on list page

### State Management

- TanStack Query for server state
- React Hook Form for form state
- Project context for current project data
- No additional global state needed

### Performance Considerations

- Pagination for large lists (default 50 items per page)
- Optimistic updates for immediate feedback
- Debounced search/filter if implemented later
- Lazy loading of detail view
- Proper query key management for cache invalidation

### Accessibility

- Keyboard navigation support (Tab, Enter, Escape)
- ARIA labels for interactive elements
- Focus management in modals
- Screen reader announcements for dynamic content
- Color contrast compliance (WCAG 2.1 AA)
- Semantic HTML structure

## External Dependencies

No new external dependencies are required. The feature will use existing packages:

- **React Hook Form** - Already installed for form management
- **Zod** - Already installed for validation
- **TanStack Query** - Already installed for data fetching
- **shadcn/ui components** - Already installed (Dialog, Button, Input, Textarea, Select, Badge)
- **lucide-react** - Already installed for icons
