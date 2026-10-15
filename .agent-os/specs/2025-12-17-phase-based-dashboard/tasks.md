# Spec Tasks

## Tasks

- [x] 1. Create Foundation: Types & Configuration
  - [x] 1.1 Add PhaseNodeData, ViewState, and PhaseNode types to `lib/types/dashboard.ts`
  - [x] 1.2 Create `lib/utils/phase-config.ts` with PHASE_INFO mapping (4 phases with titles, descriptions, icons)
  - [x] 1.3 Add METHOD_TO_PHASES mapping in phase-config.ts (map 5 sub-apps to their phases)
  - [x] 1.4 Implement getMethodsForPhase() helper function with stats integration
  - [x] 1.5 Verify types compile with `npx tsc --noEmit`

- [x] 2. Implement Layout Algorithms
  - [x] 2.1 Add getPhaseOverviewLayout() function to `lib/utils/dashboard-layout.ts` (circular positioning)
  - [x] 2.2 Add getPhaseDetailLayout() function with golden angle clustering algorithm
  - [x] 2.3 Add createPhaseFlowEdges() for phase-to-phase connections
  - [x] 2.4 Add createPhaseToMethodEdges() for phase-to-method connections
  - [x] 2.5 Test layout functions manually in browser (verify node positions and edge connections)

- [x] 3. Create Data Transformation Layer
  - [x] 3.1 Add transformToPhaseNodes() function to `lib/utils/dashboard-data-transform.ts`
  - [x] 3.2 Implement overview mode logic (project node + 4 phase nodes + flow edges)
  - [x] 3.3 Implement detail mode logic (expanded phase + method nodes + method edges)
  - [x] 3.4 Test data transformation with different view states
  - [x] 3.5 Verify all edge cases (empty phases, shared methods across multiple phases)

- [x] 4. Build Phase UI Components
  - [x] 4.1 Create `components/features/dashboard/PhaseNode.tsx` (overview variant, 380×280px)
  - [x] 4.2 Add icon, title, description, method count badge, and hover effects to PhaseNode
  - [x] 4.3 Create `components/features/dashboard/PhaseNodeExpanded.tsx` (detail variant, 480×360px)
  - [x] 4.4 Add handles (top/right/bottom/left) and "click to return" hint to PhaseNodeExpanded
  - [x] 4.5 Test components in isolation (verify styling, hover states, responsive behavior)

- [x] 5. Integrate Dashboard with Phase System
  - [x] 5.1 Add viewState state management and URL param sync to dashboard page
  - [x] 5.2 Implement zoomToPhase() transition function with fade and viewport animation
  - [x] 5.3 Implement zoomToOverview() transition function with multiple navigation triggers
  - [x] 5.4 Add BackButton component, ESC key handler, and phase card click handler
  - [x] 5.5 Register new node types (phaseNode, phaseNodeExpanded) in ReactFlow
  - [x] 5.6 Update onNodeClick handler for overview/detail mode routing
  - [x] 5.7 Replace transformToGraphNodes with transformToPhaseNodes in useMemo
  - [x] 5.8 Test complete user flow: overview → click phase → zoom in → explore methods → navigate back
  - [x] 5.9 Verify URL state persistence, browser back/forward, and all navigation methods
  - [x] 5.10 Run build and fix any TypeScript errors (`npm run build`)
