# Technical Specification

This is the technical specification for the spec detailed at `.agent-os/specs/2025-10-21-team-development-foundation/spec.md`

## Technical Requirements

### Database Schema Requirements

**Personas Table:**
- Table name: `personas`
- Columns:
  - `id` (uuid, primary key, default: gen_random_uuid())
  - `project_id` (uuid, foreign key -> projects.id, on delete cascade)
  - `name` (text, required, max 200 chars)
  - `age` (integer, optional)
  - `role` (text, optional, max 200 chars) - job title or role
  - `photo_url` (text, optional) - URL to avatar/photo in Supabase Storage
  - `goals` (text[], optional) - array of goal statements
  - `frustrations` (text[], optional) - array of pain points
  - `behaviors` (text[], optional) - array of behavior patterns
  - `bio` (text, optional, max 2000 chars) - background description
  - `created_at` (timestamptz, default: now())
  - `updated_at` (timestamptz, default: now())
  - `created_by` (uuid, foreign key -> auth.users.id)
- Indexes: `project_id`, composite index on `(project_id, created_at)`
- RLS Policies: Users can read personas from projects they're members of, create/update/delete if they're project members

**User Stories Table:**
- Table name: `user_stories`
- Columns:
  - `id` (uuid, primary key, default: gen_random_uuid())
  - `project_id` (uuid, foreign key -> projects.id, on delete cascade)
  - `title` (text, required, max 200 chars)
  - `user_role` (text, required, max 100 chars) - the "As a [role]" part
  - `action` (text, required, max 500 chars) - the "I want to [action]" part
  - `benefit` (text, required, max 500 chars) - the "so that [benefit]" part
  - `acceptance_criteria` (text[], optional) - array of acceptance criteria
  - `priority` (text, optional, enum: 'low', 'medium', 'high', 'critical')
  - `status` (text, optional, enum: 'backlog', 'in_progress', 'done')
  - `story_points` (integer, optional) - planning poker estimation
  - `created_at` (timestamptz, default: now())
  - `updated_at` (timestamptz, default: now())
  - `created_by` (uuid, foreign key -> auth.users.id)
- Indexes: `project_id`, composite index on `(project_id, priority, status)`
- RLS Policies: Users can read user stories from projects they're members of, create/update/delete if they're project members

### Project Context Provider Requirements

**Context Structure:**
```typescript
interface ProjectContextValue {
  projectId: string | null
  project: Project | null
  isLoading: boolean
  error: Error | null
  setProjectId: (id: string) => void
}
```

**Provider Location:** `lib/contexts/ProjectContext.tsx`

**Hook Export:** `useProject()` hook for consuming components

**Data Fetching:** Use TanStack Query `useProject(projectId)` hook internally

**Route Integration:** Extract `projectId` from Next.js route params `params.projectId`

### Navigation Requirements

**Layout Structure:**
- Create layout at `app/projects/[projectId]/layout.tsx`
- Sidebar navigation component at `components/layouts/ProjectSidebar.tsx`
- Sidebar shows project name at top
- Navigation links:
  - Dashboard (`/projects/[projectId]/dashboard`)
  - Personas (`/projects/[projectId]/personas`)
  - User Stories (`/projects/[projectId]/user-stories`)
- Active link highlighting
- Mobile-responsive (collapsible on small screens)

**Placeholder Pages:**
- `/projects/[projectId]/personas/page.tsx` - Shows "Personas - Coming Soon" + current project name
- `/projects/[projectId]/user-stories/page.tsx` - Shows "User Stories - Coming Soon" + current project name

### API Patterns Documentation Requirements

**Documentation File:** `docs/API_PATTERNS.md`

**Required Sections:**
1. **Route Structure Convention** - Document the `/api/[resource]` and `/api/[resource]/[id]` pattern
2. **Request Validation** - Zod schema validation pattern with examples
3. **Response Format** - ApiResponse<T> type structure with success/error examples
4. **Error Handling** - How to use apiError() and apiSuccess() utilities
5. **Authentication** - How to use getCurrentUser() in API routes
6. **Database Queries** - Supabase client patterns and RLS policy reliance
7. **Example Endpoint** - Full example showing all patterns together

### TypeScript Types Requirements

**Location:** `lib/types/database.ts`

**Required Type Definitions:**
```typescript
// Persona type
interface Persona {
  id: string
  project_id: string
  name: string
  age?: number
  role?: string
  photo_url?: string
  goals?: string[]
  frustrations?: string[]
  behaviors?: string[]
  bio?: string
  created_at: string
  updated_at: string
  created_by: string
}

// User Story type
interface UserStory {
  id: string
  project_id: string
  title: string
  user_role: string
  action: string
  benefit: string
  acceptance_criteria?: string[]
  priority?: 'low' | 'medium' | 'high' | 'critical'
  status?: 'backlog' | 'in_progress' | 'done'
  story_points?: number
  created_at: string
  updated_at: string
  created_by: string
}
```

## UI/UX Specifications

### Navigation Design
- Sidebar width: 240px on desktop, full-width drawer on mobile
- Navigation items use lucide-react icons
- Active state: highlighted background (secondary color)
- Project name displayed prominently at top
- Consistent with existing ProjectDashboard design patterns

### Placeholder Pages
- Center-aligned content
- Large icon (from lucide-react)
- "Coming Soon" heading
- "Project: [name]" subheading to verify context works
- Minimal styling using existing Tailwind classes

## Performance Criteria

- Database migrations execute in <5 seconds
- Project context loads in <500ms
- Navigation transitions are instant (client-side)
- No additional bundle size increase >50KB
- TypeScript compilation time increase <2 seconds

## Testing Requirements

- Database migrations: Run migration, verify tables exist with correct columns
- RLS Policies: Verify users can only access projects they're members of
- Project Context: Navigate to placeholder pages, verify project name displays
- Navigation: Click nav links, verify active state and route changes
- Build: `npm run build` passes
- Lint: `npm run lint` passes
- TypeScript: `npx tsc --noEmit` passes
