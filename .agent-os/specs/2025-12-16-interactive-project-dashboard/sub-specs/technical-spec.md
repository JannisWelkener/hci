# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-12-16-interactive-project-dashboard/spec.md

## Technical Requirements

### Graph Visualization

- **Library**: React Flow (reactflow package) for interactive node-based graph visualization
- **Node Types**: Custom node components extending React Flow's base node with HCI Hub styling (Tailwind CSS)
- **Layout**: Dagre algorithm for automatic hierarchical layout of workflow nodes (dagre package for layout calculation)
- **Interactivity**:
  - Zoom controls (built-in React Flow controls)
  - Pan/drag canvas (built-in React Flow feature)
  - Click-to-navigate on nodes (custom onClick handler)
  - Hover states with visual feedback (Tailwind hover utilities)

### Node Component Structure

Each node displays:
- **Icon**: Subapp-specific icon from lucide-react (FileText, Users, Map, Image, Layout)
- **Title**: Subapp name (e.g., "User Stories")
- **Count Badge**: Number of items in that subapp (e.g., "12 items")
- **Last Updated**: Relative time since last modification (e.g., "Updated 2 days ago")
- **Status Indicator**: Visual indicator if count is 0 (empty state styling)

### Data Fetching

- **API Endpoints**: Create new endpoints to fetch aggregated counts for each subapp
  - `GET /api/projects/[id]/stats` - Returns counts and last updated for all subapps
- **State Management**: TanStack Query for fetching, caching, and automatic refetching
- **Data Structure**:
  ```typescript
  type ProjectStats = {
    userStories: { count: number; lastUpdated: string | null };
    personas: { count: number; lastUpdated: string | null };
    userJourneys: { count: number; lastUpdated: string | null };
    mockups: { count: number; lastUpdated: string | null };
    wireframes: { count: number; lastUpdated: string | null };
  }
  ```

### Routing & Navigation

- **Dashboard Route**: `/projects/[id]/dashboard` (new route in app directory)
- **Navigation Targets**:
  - User Stories: `/projects/[id]/user-stories`
  - Personas: `/projects/[id]/personas`
  - User Journeys: `/projects/[id]/user-journeys`
  - Mockups: `/projects/[id]/mockups`
  - Wireframes: `/projects/[id]/wireframes`
- **Navigation Method**: Next.js `useRouter` push on node click

### Styling & Design

- **Theme**: Follow existing HCI Hub design system with Tailwind CSS 4
- **Component Library**: Use shadcn/ui Card component as base for custom nodes
- **Responsive Design**:
  - Desktop: Full graph view with all controls
  - Tablet: Scaled graph with touch-optimized controls
  - Mobile: Simplified list/card view fallback (optional enhancement)
- **Animations**: Subtle transitions on hover/click using Tailwind transitions

### Performance

- **Code Splitting**: Lazy load React Flow library to reduce initial bundle size
- **Memoization**: Use React.memo for custom node components to prevent unnecessary rerenders
- **Debouncing**: Debounce layout calculations on window resize

## External Dependencies

- **reactflow** (v11.x or latest) - Interactive node-based graph visualization library
  - **Justification**: Industry-standard React library for building node graphs with built-in zoom, pan, and drag functionality. Well-maintained with excellent TypeScript support.

- **dagre** (v0.8.x or latest) - Graph layout algorithm library
  - **Justification**: Required for automatic hierarchical layout of nodes. Works seamlessly with React Flow for positioning nodes in logical workflow order.

- **@types/dagre** - TypeScript definitions for dagre
  - **Justification**: Provides type safety for dagre layout calculations in TypeScript project.

- **date-fns** (v3.x or latest) - Date utility library for formatting relative timestamps
  - **Justification**: Lightweight alternative to Moment.js for formatting "Updated X days ago" with excellent tree-shaking support.
