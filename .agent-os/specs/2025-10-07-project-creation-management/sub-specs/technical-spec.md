# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-10-07-project-creation-management/spec.md

## Technical Requirements

### Frontend Components

#### Core Components
1. **ProjectDashboard** (Primary View)
   - Grid/card-based layout for project overview
   - Real-time project status updates
   - Quick action buttons (edit, delete, view details)
   - Filter/sort capabilities (by status, date, members)
   - Empty state for no projects
   - Loading and error states

2. **ProjectList** (Alternative View)
   - Table-based layout with sortable columns
   - Pagination or infinite scroll
   - Bulk action support
   - Column visibility toggles
   - Search and filter functionality

3. **ProjectForm** (Create/Edit)
   - Multi-step or single-form layout
   - Title field (required, max 200 chars)
   - Description field (rich text editor, max 2000 chars)
   - Start date picker (date validation)
   - Members multi-select with search
   - Phase status selectors (4 phases)
   - Auto-save draft functionality
   - Form validation feedback
   - Submit/cancel actions

4. **PhaseTracker**
   - Visual progress indicator (stepper/timeline)
   - Phase status badges (Not Started, In Progress, Completed, Blocked)
   - Phase detail cards with descriptions
   - Status update interface
   - Phase-specific metadata (start/end dates, notes)

5. **MemberSelector**
   - Searchable user dropdown
   - Selected members chips/tags
   - Avatar display
   - Role assignment (optional)
   - Add/remove member actions

#### Supporting Components (shadcn/ui)
- Button (primary, secondary, destructive variants)
- Card (project containers)
- Dialog (confirmation modals, delete warnings)
- Form components (Input, Textarea, Select, DatePicker)
- Toast (success/error notifications)
- Badge (status indicators)
- Avatar (user images)
- Dropdown Menu (action menus)
- Skeleton (loading states)

### State Management

#### TanStack Query Integration
1. **Query Keys Structure**
   ```typescript
   const projectKeys = {
     all: ['projects'] as const,
     lists: () => [...projectKeys.all, 'list'] as const,
     list: (filters: ProjectFilters) => [...projectKeys.lists(), filters] as const,
     details: () => [...projectKeys.all, 'detail'] as const,
     detail: (id: string) => [...projectKeys.details(), id] as const,
   }
   ```

2. **Queries**
   - `useProjects(filters)`: Fetch all projects with filtering
   - `useProject(id)`: Fetch single project details
   - `useProjectMembers(id)`: Fetch project team members
   - `usePhaseStatus(projectId, phase)`: Fetch specific phase status

3. **Mutations**
   - `useCreateProject()`: Create new project with optimistic updates
   - `useUpdateProject()`: Update project with optimistic updates
   - `useDeleteProject()`: Delete project with cache invalidation
   - `useUpdatePhaseStatus()`: Update phase status with real-time sync

4. **Cache Strategy**
   - Stale time: 5 minutes for list queries
   - Cache time: 30 minutes
   - Automatic refetch on window focus
   - Optimistic updates for mutations
   - Background refetch for active queries

#### React Context Usage
1. **ProjectContext**
   - Current active project
   - View mode (dashboard/list)
   - Filter preferences
   - Sort preferences

2. **UserContext**
   - Current user profile
   - User permissions
   - Team memberships

### Form Validation

#### Zod Schema Definitions
```typescript
// Project Creation/Update Schema
const ProjectSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less')
    .trim(),

  description: z.string()
    .max(2000, 'Description must be 2000 characters or less')
    .optional()
    .transform(val => val?.trim()),

  start_date: z.date({
    required_error: 'Start date is required',
    invalid_type_error: 'Invalid date format',
  })
    .min(new Date('2020-01-01'), 'Start date cannot be before 2020')
    .max(new Date('2030-12-31'), 'Start date cannot be after 2030'),

  members: z.array(z.string().uuid('Invalid member ID'))
    .min(1, 'At least one team member is required')
    .max(50, 'Maximum 50 team members allowed'),

  phases: z.object({
    observation: z.enum(['not_started', 'in_progress', 'completed', 'blocked']),
    ideation: z.enum(['not_started', 'in_progress', 'completed', 'blocked']),
    prototyping: z.enum(['not_started', 'in_progress', 'completed', 'blocked']),
    evaluation: z.enum(['not_started', 'in_progress', 'completed', 'blocked']),
  })
});

// Phase Update Schema
const PhaseUpdateSchema = z.object({
  phase: z.enum(['observation', 'ideation', 'prototyping', 'evaluation']),
  status: z.enum(['not_started', 'in_progress', 'completed', 'blocked']),
  notes: z.string().max(500).optional(),
});
```

#### React Hook Form Configuration
- Mode: `onBlur` for real-time validation
- Resolver: `zodResolver(ProjectSchema)`
- Default values: Pre-populated for edit mode
- Form state: isDirty, isValid, errors tracking
- Field-level error messages
- Async validation for unique titles (optional)

### Real-time Features

#### Supabase Realtime Integration
1. **Project Updates Subscription**
   ```typescript
   // Subscribe to project changes
   supabase
     .channel('projects-changes')
     .on('postgres_changes',
       { event: '*', schema: 'public', table: 'projects' },
       (payload) => {
         // Invalidate TanStack Query cache
         queryClient.invalidateQueries({ queryKey: projectKeys.all })
       }
     )
     .subscribe()
   ```

2. **Phase Status Sync**
   - Real-time phase status updates across all connected clients
   - Conflict resolution: Last-write-wins strategy
   - Visual indicators for concurrent edits
   - Auto-refresh on reconnection

3. **Presence Tracking**
   - Show active users viewing/editing a project
   - Cursor/selection indicators (optional)
   - "Currently editing" badges
   - Idle timeout: 5 minutes

4. **Collaborative Features**
   - Live member additions/removals
   - Real-time comment updates (future enhancement)
   - Activity feed for project changes
   - Notification system for @mentions

### Performance Considerations

#### Optimization Strategies
1. **Code Splitting**
   - Lazy load ProjectForm component
   - Dynamic imports for rich text editor
   - Route-based code splitting (Next.js automatic)
   - Component-level suspense boundaries

2. **Data Fetching**
   - Prefetch project list on dashboard load
   - Pagination: 20 projects per page
   - Virtual scrolling for large lists (react-window)
   - Debounced search queries (300ms delay)
   - Request deduplication via TanStack Query

3. **Rendering Optimization**
   - Memoize expensive computations (useMemo)
   - Prevent unnecessary re-renders (React.memo)
   - Optimize phase tracker calculations
   - Use CSS transforms for animations

4. **Caching Strategy**
   - Browser cache for static assets
   - Service worker for offline support (future)
   - IndexedDB for draft project storage
   - TanStack Query cache persistence

5. **Image Optimization**
   - Next.js Image component for avatars
   - Lazy loading for member avatars
   - WebP format with fallbacks
   - Responsive image sizes

6. **Bundle Size**
   - Tree-shaking unused code
   - Minimize third-party dependencies
   - Analyze bundle with @next/bundle-analyzer
   - Target: <500KB initial JS bundle

7. **Database Queries**
   - Index on user_id, created_at, start_date
   - Composite index on (user_id, created_at)
   - Row-level security policies for efficient filtering
   - Limit result sets with pagination

8. **Real-time Performance**
   - Throttle Supabase subscription updates (500ms)
   - Batch multiple phase updates
   - Unsubscribe from channels on unmount
   - Graceful degradation if real-time unavailable

## External Dependencies (Conditional)

### New Dependencies Required

#### UI Components
- **@radix-ui/react-*** (shadcn/ui primitives): Accessible component primitives
- **lucide-react**: Icon library for consistent iconography
- **class-variance-authority**: Component variant management
- **clsx** + **tailwind-merge**: Conditional className utilities

#### State Management
- **@tanstack/react-query**: Server state management (v5.x)
- **@tanstack/react-query-devtools**: Development tools for debugging queries

#### Form Management
- **react-hook-form**: Form state and validation (v7.x)
- **@hookform/resolvers**: Zod resolver integration

#### Validation
- **zod**: Schema validation library (v3.x)

#### Date Handling
- **date-fns**: Date utility library for date picker and formatting

#### Rich Text (Optional)
- **@tiptap/react**: Rich text editor for descriptions (if rich text needed)
- **@tiptap/starter-kit**: Basic editor extensions

#### Real-time
- **@supabase/supabase-js**: Already included in project

#### Development Tools
- **@next/bundle-analyzer**: Bundle size analysis (devDependency)

### Installation Commands
```bash
# Core dependencies
npm install @tanstack/react-query @tanstack/react-query-devtools
npm install react-hook-form @hookform/resolvers
npm install zod
npm install date-fns

# shadcn/ui setup (via CLI)
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card dialog form input textarea select label badge avatar dropdown-menu toast skeleton

# Optional rich text editor
npm install @tiptap/react @tiptap/starter-kit

# Development tools
npm install -D @next/bundle-analyzer
```
