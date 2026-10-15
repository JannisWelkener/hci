# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-12-17-phase-based-dashboard/spec.md

## Technical Requirements

### Component Architecture

- **Create `PhaseNode.tsx`** - Overview variant component (380×280px) displaying phase icon, title, description, method count, and "Click to explore" hint with hover effects
- **Create `PhaseNodeExpanded.tsx`** - Detail variant component (480×360px) for centered display with "Click to return" hint and handles on all 4 sides for method connections
- **Register new node types** in ReactFlow: `phaseNode` and `phaseNodeExpanded` alongside existing `projectNode` and `dashboardNode`

### State Management

- **ViewState interface** with `level: 'overview' | 'detail'` and `selectedPhaseId: IsoPhase | null`
- **URL parameter sync** using Next.js `useSearchParams` and `useRouter` for state persistence (`?phase=understand_context`)
- **Transition state** to prevent click events during animations (`isTransitioning` boolean)

### Layout Algorithms

- **Phase Overview Layout** - Position 4 phases in circle at radius 600px with angles: Analysis (270°), User Requirements (0°), Solutions (90°), Evaluation (180°); project node at (-800, -400)
- **Phase Detail Layout** - Phase centered at (0,0); methods positioned using golden angle distribution (137.5° increments) with base radius 450px and variable spacing using Vogel's method
- **Edge creation functions** - `createPhaseFlowEdges()` for phase-to-phase connections in overview; `createPhaseToMethodEdges()` for phase-to-method in detail view

### Data Transformation

- **Phase configuration** in `lib/utils/phase-config.ts` with `PHASE_INFO` record mapping IsoPhase enum to metadata (title, description, icon)
- **Method-to-phase mapping** - `METHOD_TO_PHASES` record defining which sub-apps belong to each phase
- **`transformToPhaseNodes()` function** - Generates nodes/edges based on view state (overview vs detail mode)
- **`getMethodsForPhase()` helper** - Returns filtered methods with counts for a specific phase

### Transitions & Animations

- **Fade transition** - 250ms opacity fade out, switch nodes, 250ms fade in using inline styles
- **Viewport animation** - ReactFlow `fitView()` with 500ms duration, padding 0.15-0.2, zoom range 0.4-1.0
- **Total transition time** - ~800ms (250ms fade out + 50ms pause + 500ms viewport + 250ms fade in)
- **No external animation libraries** - Use only Tailwind CSS transitions (`transition-all duration-200`) and ReactFlow's built-in viewport API

### Navigation Implementation

- **Back button component** - Positioned top-left (absolute), visible only in detail mode, calls `zoomToOverview()`
- **ESC key handler** - `useEffect` with keyboard event listener, calls `zoomToOverview()` when ESC pressed in detail mode
- **Phase card click** - In detail mode, clicking the expanded phase card triggers `zoomToOverview()`
- **Method click** - In detail mode, clicking a method node navigates to that sub-app route using `router.push()`

### Type Definitions

```typescript
// lib/types/dashboard.ts additions

export interface PhaseNodeData {
  phaseId: IsoPhase;
  title: string;
  description: string;
  icon: string;
  methodCount: number;
  methods: SubappType[];
  variant: 'overview' | 'expanded';
}

export interface ViewState {
  level: 'overview' | 'detail';
  selectedPhaseId: IsoPhase | null;
}

export type PhaseNode = Node<PhaseNodeData>;
```

### Edge Configurations

**Overview mode:**
- Type: `smoothstep`
- Animated: `true`
- Stroke width: `3px`
- Marker end: `arrowclosed`
- Color: `hsl(var(--primary))`

**Detail mode:**
- Type: `smoothstep`
- Animated: `false`
- Stroke width: `2px`
- Opacity: `0.5`
- Color: `hsl(var(--primary) / 0.5)`

### ReactFlow Configuration Updates

- **useReactFlow hook** - Access ReactFlow instance for viewport control (`setCenter`, `fitView`)
- **fitViewOptions** - Update based on mode (overview: padding 0.15, maxZoom 1.0; detail: padding 0.2, maxZoom 0.8)
- **Node style updates** - Dynamically set opacity during transitions via inline styles
- **Prevent interactions during transitions** - Check `isTransitioning` before handling click events

### Phase & Method Mapping

**Analysis (understand_context):**
- Icon: Search
- Description: "Understand user needs & goals"
- Methods: Personas, User Journeys

**User Requirements (specify_requirements):**
- Icon: ClipboardList
- Description: "Define solution requirements"
- Methods: Personas, User Stories, User Journeys, Wireframes, Mockups

**Solutions (produce_design_solutions):**
- Icon: Lightbulb
- Description: "Build & test prototypes"
- Methods: Mockups

**Evaluation (evaluate_against_requirements):**
- Icon: CheckCircle
- Description: "Test & refine with users"
- Methods: (empty - coming soon)

### Performance Considerations

- **useMemo for data transform** - Memoize `transformToPhaseNodes()` output to prevent unnecessary recalculations
- **useCallback for handlers** - Memoize zoom and navigation functions
- **Node count optimization** - Maximum ~10-15 nodes per view (4-6 in overview, 6-10 in detail)
- **Transition throttling** - Disable interactions during transitions to prevent state conflicts

### Browser Compatibility

- **URL API** - Use Next.js URLSearchParams API (works in all modern browsers)
- **Keyboard events** - Standard KeyboardEvent API (`e.key === 'Escape'`)
- **ReactFlow** - Already supports major browsers (Chrome, Firefox, Safari, Edge)
- **CSS transitions** - Tailwind generates vendor-prefixed CSS automatically

### Accessibility

- **Keyboard navigation** - ESC key for back navigation
- **ARIA labels** - Phase cards should have descriptive aria-label attributes
- **Focus management** - Preserve focus state during transitions where possible
- **Semantic HTML** - Use button elements for back button with proper text content
