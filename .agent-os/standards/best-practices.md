# Development Best Practices

## Context

Development Best Practices - HCI Study Design Platform
Context
Global development guidelines for HCI Study Design web application (Next.js/React + NestJS/TypeScript).
<conditional-block context-check="core-principles">
IF this Core Principles section already read in current context:
  SKIP: Re-reading this section
  NOTE: "Using Core Principles already in context"
ELSE:
  READ: The following principles
Core Principles
Keep It Simple

Implement features in the fewest lines possible while maintaining clarity
Avoid over-engineering solutions (no premature optimization)
Choose straightforward approaches over clever abstractions
Start with the simplest working solution, iterate based on real usage
Prefer composition over complex inheritance hierarchies

Optimize for Readability

Prioritize code clarity over micro-optimizations
Write self-documenting code with descriptive variable and function names
Add comments for "why" not "what"
Use TypeScript types to make intentions explicit
Follow consistent patterns across the codebase

DRY (Don't Repeat Yourself)

Extract repeated business logic to utility functions or services
Create reusable UI components for common patterns
Use custom hooks for shared React logic
Define shared types in dedicated type definition files
Centralize configuration values and constants

File Structure
src/
├── app/                    # Next.js app router pages
│   ├── (auth)/            # Auth-protected routes group
│   ├── (public)/          # Public routes group
│   └── api/               # API routes
├── components/
│   ├── ui/                # Shadcn/ui base components
│   ├── features/          # Feature-specific components
│   │   ├── personas/
│   │   ├── user-stories/
│   │   └── journey-maps/
│   └── shared/            # Shared components
├── lib/
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Utility functions
│   ├── validations/       # Zod schemas
│   └── api/               # API client functions
├── types/                 # TypeScript type definitions
└── config/                # Configuration files
Keep Files Focused

One component per file (exceptions: tightly coupled sub-components)
Group related functionality by feature, not by technical layer
Use consistent naming conventions across the codebase
Limit file length to ~300 lines (split larger files)

</conditional-block>
<conditional-block context-check="architecture" task-condition="writing-fullstack-code">
IF current task involves writing application code:
  IF Architecture section already read in current context:
    SKIP: Re-reading this section
    NOTE: "Using Architecture guidelines already in context"
  ELSE:
    READ: The following guidelines
ELSE:
  SKIP: Architecture section not relevant to current task
Architecture
Frontend (Next.js + React)
Component Structure

Smart Components: Manage state, handle data fetching, contain business logic
Presentational Components: Receive props, render UI, emit events
Layout Components: Define page structure, manage navigation
Keep components small and focused (single responsibility)

State Management

Use React Context for global UI state (theme, user preferences)
Use TanStack Query for server state (caching, refetching, synchronization)
Use local state (useState) for component-specific UI state
Lift state to the lowest common ancestor when sharing between components

Data Fetching Pattern
typescript// Custom hook pattern
function useProject(projectId: string) {
  return useQuery({
    queryKey: ['project', projectId],
    queryFn: () => api.projects.getById(projectId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Usage in component
function ProjectDetail({ projectId }: Props) {
  const { data: project, isLoading, error } = useProject(projectId)
  
  if (isLoading) return <ProjectSkeleton />
  if (error) return <ErrorDisplay error={error} />
  if (!project) return <NotFound />
  
  return <ProjectContent project={project} />
}
Form Handling

Use React Hook Form for form state management
Use Zod for schema validation
Validate on blur and submit (not on every keystroke)
Show inline validation errors
Disable submit while submitting

Backend (NestJS)
Module Structure
src/
├── modules/
│   ├── projects/
│   │   ├── dto/              # Data transfer objects
│   │   ├── entities/         # Database entities
│   │   ├── projects.controller.ts
│   │   ├── projects.service.ts
│   │   └── projects.module.ts
│   ├── personas/
│   ├── user-stories/
│   └── methods/
├── common/
│   ├── decorators/           # Custom decorators
│   ├── filters/              # Exception filters
│   ├── guards/               # Auth guards
│   ├── interceptors/         # Response interceptors
│   └── pipes/                # Validation pipes
└── database/
    ├── migrations/
    └── seeds/
Service Layer Pattern

Keep controllers thin (routing, validation, response formatting only)
Put business logic in services
Use dependency injection for testability
Return domain objects, not raw database entities
Handle errors in services, let controllers format responses

Database Access

Use Supabase client for database operations
Use Row Level Security (RLS) for authorization
Write TypeScript interfaces matching database schema
Use transactions for multi-step operations
Index frequently queried columns

API Design

Follow RESTful conventions
Use proper HTTP status codes
Return consistent error format
Version APIs when breaking changes needed
Document endpoints with Swagger/OpenAPI

Real-time Features (Supabase Realtime)
typescript// Subscribe to project updates
const subscription = supabase
  .channel(`project:${projectId}`)
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'projects',
      filter: `id=eq.${projectId}`
    },
    (payload) => {
      queryClient.invalidateQueries(['project', projectId])
    }
  )
  .subscribe()

// Clean up on unmount
return () => subscription.unsubscribe()
</conditional-block>
<conditional-block context-check="dependencies" task-condition="choosing-external-library">
IF current task involves choosing an external library:
  IF Dependencies section already read in current context:
    SKIP: Re-reading this section
    NOTE: "Using Dependencies guidelines already in context"
  ELSE:
    READ: The following guidelines
ELSE:
  SKIP: Dependencies section not relevant to current task
Dependencies
Choose Libraries Wisely
When adding third-party dependencies:

Select actively maintained libraries (commits within last 3 months)
Check GitHub stars (>1k preferred), npm weekly downloads
Review issue resolution speed and quality
Read documentation quality
Check TypeScript support quality
Prefer libraries with smaller bundle sizes
Check license compatibility (MIT, Apache 2.0 preferred)

Essential Dependencies Only

Don't add dependencies for trivial functionality
Avoid deprecated or unmaintained libraries
Keep total dependency count reasonable (<50 direct dependencies)
Regular audit for unused dependencies (use depcheck)
Review security vulnerabilities monthly (npm audit)

Approved Stack
Frontend:

Next.js 14+ (App Router)
React 18+
TypeScript 5+
TanStack Query (React Query)
React Hook Form + Zod
Tailwind CSS
Shadcn/ui
Lucide React (icons)

Backend:

NestJS 10+
TypeScript 5+
Supabase Client
Class Validator
Class Transformer

Development:

Vitest (testing)
Playwright (E2E testing)
ESLint + Prettier
Husky (git hooks)

Version Management

Use pnpm for package management (faster, more efficient)
Pin exact versions in package.json for stability
Update dependencies monthly in dedicated PRs
Test thoroughly after updates
Document breaking changes in CHANGELOG.md

</conditional-block>
<conditional-block context-check="testing" task-condition="writing-tests">
IF current task involves writing or updating tests:
  IF Testing section already read in current context:
    SKIP: Re-reading this section
    NOTE: "Using Testing guidelines already in context"
  ELSE:
    READ: The following guidelines
ELSE:
  SKIP: Testing section not relevant to current task
Testing
Test Strategy
Unit Tests: Business logic, utilities, hooks, services
Integration Tests: API endpoints, database operations
Component Tests: React components in isolation
E2E Tests: Critical user flows
Unit Testing (Vitest)
typescript// Test business logic
describe('shuffleQuestions', () => {
  it('should randomize question order', () => {
    const questions = [q1, q2, q3, q4, q5]
    const shuffled = shuffleQuestions(questions)
    
    expect(shuffled).toHaveLength(5)
    expect(shuffled).not.toEqual(questions)
    expect(shuffled).toEqual(expect.arrayContaining(questions))
  })
  
  it('should not modify original array', () => {
    const original = [q1, q2, q3]
    shuffleQuestions(original)
    expect(original).toEqual([q1, q2, q3])
  })
})

// Test custom hooks
describe('useProject', () => {
  it('should fetch project data', async () => {
    const { result } = renderHook(() => useProject('123'))
    
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    
    expect(result.current.data).toMatchObject({
      id: '123',
      name: 'Test Project'
    })
  })
})
Component Testing (React Testing Library)
typescriptdescribe('PersonaCard', () => {
  it('should render persona information', () => {
    render(<PersonaCard persona={mockPersona} />)
    
    expect(screen.getByText('Sarah Johnson')).toBeInTheDocument()
    expect(screen.getByText('34 years old')).toBeInTheDocument()
  })
  
  it('should call onEdit when edit button clicked', async () => {
    const onEdit = vi.fn()
    render(<PersonaCard persona={mockPersona} onEdit={onEdit} />)
    
    await userEvent.click(screen.getByRole('button', { name: /edit/i }))
    expect(onEdit).toHaveBeenCalledWith(mockPersona)
  })
})
API Testing
typescriptdescribe('ProjectsController', () => {
  it('should create new project', async () => {
    const dto: CreateProjectDto = {
      name: 'New Project',
      description: 'Test description'
    }
    
    const result = await controller.create(dto, mockUser)
    
    expect(result).toMatchObject({
      name: dto.name,
      userId: mockUser.id
    })
  })
  
  it('should throw error for invalid input', async () => {
    const dto: CreateProjectDto = { name: '', description: '' }
    
    await expect(
      controller.create(dto, mockUser)
    ).rejects.toThrow(BadRequestException)
  })
})
E2E Testing (Playwright)
typescripttest('user can create a persona', async ({ page }) => {
  await page.goto('/projects/123/personas')
  await page.click('button:text("Create Persona")')
  
  await page.fill('input[name="name"]', 'Alex Turner')
  await page.fill('input[name="age"]', '28')
  await page.click('button:text("Save")')
  
  await expect(page.locator('text=Alex Turner')).toBeVisible()
})
Coverage Goals

Business logic: >80%
Services: >70%
Components: >60%
Overall: >65%

</conditional-block>
<conditional-block context-check="performance" task-condition="performance-consideration">
IF current task involves performance-critical code:
  IF Performance section already read in current context:
    SKIP: Re-reading this section
    NOTE: "Using Performance guidelines already in context"
  ELSE:
    READ: The following guidelines
ELSE:
  SKIP: Performance section not relevant to current task
Performance
Frontend Optimization
React Rendering
typescript// Memoize expensive calculations
const filteredMethods = useMemo(() => {
  return methods.filter(m => m.phase === currentPhase)
}, [methods, currentPhase])

// Memoize callbacks to prevent re-renders
const handleSelect = useCallback((id: string) => {
  setSelectedId(id)
}, [])

// Memoize components that receive object props
const PersonaCard = memo(function PersonaCard({ persona }: Props) {
  // ... component logic
})
Code Splitting
typescript// Route-based splitting (automatic with Next.js)
const PersonaEditor = dynamic(() => import('@/components/features/personas/PersonaEditor'))

// Lazy load heavy components
const JourneyMapVisualizer = lazy(() => import('./JourneyMapVisualizer'))
Image Optimization

Use Next.js <Image> component
Provide proper width/height
Use appropriate formats (WebP with fallback)
Lazy load images below the fold
Compress images before upload

Database Optimization
Query Optimization
typescript// ❌ Bad: N+1 query problem
const projects = await supabase.from('projects').select('*')
for (const project of projects) {
  const personas = await supabase
    .from('personas')
    .select('*')
    .eq('project_id', project.id)
}

// ✅ Good: Single query with join
const projects = await supabase
  .from('projects')
  .select(`
    *,
    personas (*)
  `)
Indexing Strategy
sql-- Index frequently filtered columns
CREATE INDEX idx_personas_project_id ON personas(project_id);
CREATE INDEX idx_user_stories_priority ON user_stories(priority);
CREATE INDEX idx_projects_user_id_created_at ON projects(user_id, created_at);

-- Use partial indexes for filtered queries
CREATE INDEX idx_active_projects ON projects(user_id) 
WHERE deleted_at IS NULL;
Pagination
typescript// Use cursor-based pagination for large datasets
async function getProjects(userId: string, cursor?: string, limit = 20) {
  const query = supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (cursor) {
    query.lt('created_at', cursor)
  }
  
  return query
}
Caching Strategy
Client-Side (TanStack Query)
typescript// Cache frequently accessed data
queryClient.setQueryDefaults(['methods'], {
  staleTime: 10 * 60 * 1000, // 10 minutes
  cacheTime: 30 * 60 * 1000, // 30 minutes
})

// Prefetch predictable navigation
function ProjectList() {
  const queryClient = useQueryClient()
  
  const handleHover = (projectId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['project', projectId],
      queryFn: () => api.projects.getById(projectId)
    })
  }
}
Server-Side (Next.js)
typescript// Cache static data
export const revalidate = 3600 // 1 hour

// On-demand revalidation
await revalidatePath('/projects/[id]')
Bundle Size

Monitor bundle size with next-bundle-analyzer
Keep client bundles < 200KB (initial load)
Use server components when possible (Next.js App Router)
Tree-shake unused code
Avoid importing entire libraries (use named imports)

</conditional-block>
<conditional-block context-check="security" task-condition="handling-sensitive-data">
IF current task involves security or sensitive data:
  IF Security section already read in current context:
    SKIP: Re-reading this section
    NOTE: "Using Security guidelines already in context"
  ELSE:
    READ: The following guidelines
ELSE:
  SKIP: Security section not relevant to current task
Security & Privacy
Authentication (Supabase Auth)
typescript// Server-side auth check
import { createServerClient } from '@/lib/supabase/server'

export async function getServerSideProps(context) {
  const supabase = createServerClient(context)
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    return { redirect: { destination: '/login', permanent: false } }
  }
  
  return { props: { user: session.user } }
}
Authorization (Row Level Security)
sql-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Users can only access their own projects
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);
Input Validation
typescript// Always validate user input
import { z } from 'zod'

const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
})

// Backend validation
@Post()
async create(@Body() dto: CreateProjectDto) {
  const validated = createProjectSchema.parse(dto)
  return this.projectsService.create(validated)
}
XSS Prevention

Never use dangerouslySetInnerHTML without sanitization
Validate and escape user input
Use Content Security Policy headers
Sanitize Markdown with libraries like dompurify

CSRF Protection

Use SameSite cookies
Validate origin headers
Implement CSRF tokens for state-changing operations

Environment Variables
typescript// ❌ Never commit secrets
DATABASE_URL=postgresql://user:password@localhost

// ✅ Use environment variables
DATABASE_URL=process.env.DATABASE_URL

// Validate env vars on startup
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string(),
})

envSchema.parse(process.env)
Data Privacy

Don't log sensitive data (passwords, tokens, PII)
Encrypt sensitive data at rest
Use HTTPS in production
Implement proper session management
Provide data export and deletion features (GDPR)

</conditional-block>
<conditional-block context-check="accessibility" task-condition="building-ui">
IF current task involves building user interface:
  IF Accessibility section already read in current context:
    SKIP: Re-reading this section
    NOTE: "Using Accessibility guidelines already in context"
  ELSE:
    READ: The following guidelines
ELSE:
  SKIP: Accessibility section not relevant to current task
Accessibility (WCAG 2.1 AA)
Semantic HTML
tsx// ✅ Good: Semantic structure
<nav>
  <ul>
    <li><a href="/projects">Projects</a></li>
  </ul>
</nav>

<main>
  <h1>Project Title</h1>
  <section>
    <h2>Personas</h2>
    {/* content */}
  </section>
</main>

// ❌ Bad: Divs everywhere
<div className="nav">
  <div className="link">Projects</div>
</div>
ARIA Labels
tsx// Descriptive labels
<button aria-label="Delete persona Sarah Johnson">
  <TrashIcon />
</button>

// Dynamic labels
<button aria-label={`Edit ${persona.name}`}>
  <EditIcon />
</button>

// Form labels
<label htmlFor="persona-name">Persona Name</label>
<input id="persona-name" name="name" />
Keyboard Navigation
tsx// Support keyboard interaction
function PersonaCard({ persona }: Props) {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      onSelect(persona.id)
    }
  }
  
  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={() => onSelect(persona.id)}
    >
      {/* content */}
    </div>
  )
}
Focus Management
tsx// Trap focus in modals
import { FocusTrap } from '@headlessui/react'

function Modal({ isOpen, onClose }: Props) {
  return (
    <Dialog open={isOpen} onClose={onClose}>
      <FocusTrap>
        {/* modal content */}
      </FocusTrap>
    </Dialog>
  )
}

// Move focus to important elements
const inputRef = useRef<HTMLInputElement>(null)

useEffect(() => {
  if (isOpen) {
    inputRef.current?.focus()
  }
}, [isOpen])
Color Contrast

Ensure 4.5:1 contrast ratio for normal text
Ensure 3:1 contrast ratio for large text (18pt+)
Don't rely solely on color to convey information
Test with color blindness simulators

Screen Readers
tsx// Announce dynamic updates
<div role="status" aria-live="polite">
  {message}
</div>

// Hide decorative elements
<img src="decoration.svg" alt="" aria-hidden="true" />

// Provide context for icons
<button>
  <SaveIcon aria-hidden="true" />
  <span>Save Project</span>
</button>
</conditional-block>
Project-Specific Best Practices
HCI Method Library

Keep method descriptions concise but complete
Include practical examples for each method
Provide downloadable templates
Link to academic sources when appropriate
Update methods based on user feedback

Persona Management

Validate persona data completeness
Support photo uploads (with compression)
Export personas as PDF or PNG
Allow persona templates for quick creation
Link personas to user stories and journeys

User Story Quality

Validate standard format ("As a... I want... so that...")
Suggest improvements using AI
Check for testable acceptance criteria
Prevent duplicate stories
Support story prioritization (MoSCoW, Planning Poker)

Journey Map Visualization

Auto-save drafts every 30 seconds
Support collaborative editing (show who's viewing)
Export as PNG, PDF, or shareable link
Provide journey map templates
Highlight emotional pain points automatically

AI Integration Best Practices

Show AI suggestions, don't auto-apply
Allow users to accept/reject AI recommendations
Explain AI reasoning when possible
Respect user privacy (don't train on user data)
Provide manual alternatives for all AI features
Rate-limit AI requests to manage costs

Multi-language Support (Future)

Use i18next for translations
Support English and German initially
Extract all strings to translation files
Handle pluralization and date formatting
Test with both languages regularly

Version Control

Use conventional commits: feat:, fix:, docs:, refactor:
Write descriptive commit messages (why, not what)
Create feature branches: feature/persona-editor
Squash commits before merging
Tag releases: v1.0.0, v1.1.0

Documentation

Document all environment variables in .env.example
Maintain API documentation with Swagger
Write README for each major feature
Document deployment process
Keep architecture decision records (ADRs)

Monitoring & Analytics

Log errors to error tracking service (Sentry)
Track user flows with analytics (PostHog, Plausible)
Monitor API performance
Set up uptime monitoring
Create dashboards for key metrics