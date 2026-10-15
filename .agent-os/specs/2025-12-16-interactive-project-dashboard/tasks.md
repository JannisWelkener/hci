# Spec Tasks

## Tasks

- [x] 1. Create API endpoint for dashboard statistics
  - [ ] 1.1 Write tests for GET /api/projects/[id]/stats endpoint
  - [x] 1.2 Create route.ts file at app/api/projects/[id]/stats/route.ts
  - [x] 1.3 Implement authentication and authorization checks
  - [x] 1.4 Query database for counts of user stories, personas, user journey maps, mockups, and wireframes
  - [x] 1.5 Query database for latest updated_at timestamps for each subapp
  - [x] 1.6 Format response with type-safe schema using Zod
  - [x] 1.7 Add error handling for database failures
  - [ ] 1.8 Verify all tests pass

- [x] 2. Install and configure React Flow dependencies
  - [x] 2.1 Install react-flow-renderer (or @xyflow/react) and dagre layout library
  - [x] 2.2 Install type definitions for React Flow and Dagre
  - [x] 2.3 Create types file for dashboard nodes and edges at lib/types/dashboard.ts
  - [x] 2.4 Define NodeData interface with id, label, count, lastUpdated, icon, route properties
  - [x] 2.5 Define EdgeData interface for connections between nodes
  - [x] 2.6 Verify installation by importing in a test component

- [x] 3. Build custom node component and layout utilities
  - [ ] 3.1 Write tests for DashboardNode component
  - [x] 3.2 Create components/dashboard/DashboardNode.tsx with custom node UI
  - [x] 3.3 Implement node design with icon, title, count badge, and last updated timestamp
  - [x] 3.4 Add hover states and click handling for navigation
  - [x] 3.5 Create lib/utils/dashboard-layout.ts with Dagre layout algorithm
  - [x] 3.6 Implement automatic node positioning function using Dagre
  - [x] 3.7 Style node component with Tailwind CSS and shadcn/ui components
  - [ ] 3.8 Verify all tests pass

- [x] 4. Implement dashboard page with React Flow integration
  - [ ] 4.1 Write tests for dashboard page data fetching and rendering
  - [x] 4.2 Set up TanStack Query hook for fetching /api/projects/[id]/stats
  - [x] 4.3 Transform API data into React Flow nodes and edges format
  - [x] 4.4 Update app/projects/[projectId]/dashboard/page.tsx with ReactFlow component
  - [x] 4.5 Configure React Flow with controls, minimap, and background
  - [x] 4.6 Implement click handlers to navigate using Next.js router
  - [x] 4.7 Add loading and error states for data fetching
  - [ ] 4.8 Verify all tests pass

- [x] 5. Polish styling and add responsive design
  - [ ] 5.1 Write tests for responsive behavior and edge cases
  - [x] 5.2 Apply Tailwind CSS responsive utilities for mobile, tablet, and desktop
  - [x] 5.3 Optimize node spacing and edge routing for different screen sizes
  - [x] 5.4 Add subtle animations for node hover and click interactions
  - [x] 5.5 Ensure color scheme matches existing shadcn/ui theme
  - [x] 5.6 Test dashboard with empty projects (0 items in all categories)
  - [x] 5.7 Add tooltips for additional node information using shadcn/ui Tooltip
  - [ ] 5.8 Verify all tests pass and perform final integration testing
