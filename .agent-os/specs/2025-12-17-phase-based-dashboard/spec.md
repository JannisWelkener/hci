# Spec Requirements Document

> Spec: Phase-Based Interactive Dashboard
> Created: 2025-12-17

## Overview

Transform the project dashboard from a radial hub-and-spoke visualization into a phase-based two-level zoom system that aligns with the ISO 9241-210 Human-Centered Design process flow. This redesign will provide students with a clearer understanding of the HCI methodology phases (Analysis, User Requirements, Solutions, Evaluation) while maintaining interactive exploration of individual methods through smooth zoom transitions.

## User Stories

### HCI Student Exploring Project Structure

As an HCI master's student, I want to see my project organized by HCI methodology phases rather than individual tools, so that I can better understand where I am in the design process and which phase I should focus on next.

**Workflow:** Student opens their project dashboard and sees four phase cards arranged in a circular flow (Analysis → User Requirements → Solutions → Evaluation) around an empty center, with the project node positioned top-left. Each phase card shows a title, description of what that phase entails, and a count of how many items exist across all methods in that phase. The student can immediately understand the overall process flow and see which phases have work completed.

**Problem Solved:** Students currently see individual sub-apps radiating from a central hub, which doesn't communicate the methodological progression or help them understand which phase they're in. The new design emphasizes the HCI process structure.

### Student Diving Deep into a Phase

As an HCI student, I want to click on a phase to zoom in and see all the specific methods (personas, user stories, etc.) belonging to that phase, so that I can focus on the relevant tools without distraction.

**Workflow:** Student clicks on the "User Requirements" phase card. The view smoothly transitions (fade out/in with viewport animation) to show the phase card at the center with method nodes (Personas, User Stories, User Journeys, Wireframes, Mockups) clustered organically around it. The student can then click any method to navigate to that feature, or use multiple navigation options (back button, ESC key, or clicking the phase card) to return to the overview.

**Problem Solved:** Currently, all sub-apps are always visible in a flat hierarchy. The two-level system allows students to focus on one phase at a time, reducing cognitive load and reinforcing the methodological structure.

### Student Navigating Between Phases

As an HCI student, I want to easily switch between viewing different phases and return to the overview, so that I can explore the project structure fluidly without getting lost.

**Workflow:** From the overview, student clicks "Analysis" phase and explores its methods (Personas, User Journeys). They press ESC or click the back button to return to overview, then click "Solutions" phase to see implementation methods. The transitions are smooth and the URL updates, allowing them to bookmark specific views or use browser back/forward navigation.

**Problem Solved:** Navigation is clear with multiple intuitive options (back button, ESC, click phase) and URLs preserve state for sharing links to specific phase views.

## Spec Scope

1. **Phase-Based Overview Layout** - Replace radial hub layout with circular phase arrangement (4 phase nodes positioned top, right, bottom, left with empty center and project node top-left)

2. **Two-Level Zoom System** - Implement overview mode (shows phases) and detail mode (shows methods within a phase) with smooth viewport transitions

3. **Phase Configuration & Mapping** - Define phase metadata (titles, descriptions, icons) and map existing sub-apps to appropriate phases (Analysis, User Requirements, Solutions, Evaluation)

4. **Interactive Transitions** - Create fade-based transitions with ReactFlow viewport animations for zooming in/out of phases

5. **Multiple Navigation Methods** - Implement back button, ESC key handler, and click-phase-to-return functionality for returning to overview

6. **URL State Management** - Sync view state with URL parameters for shareable links and browser navigation support

7. **Organic Method Clustering** - Position methods around phase using golden angle distribution algorithm for natural, non-rigid layout

## Out of Scope

- Adding new sub-apps or methods (only reorganize existing: personas, user-stories, user-journeys, wireframes, mockups)
- Changing existing sub-app functionality or UI
- Adding animation libraries (use only Tailwind CSS transitions and ReactFlow's built-in viewport API)
- Database or API changes (purely frontend visualization redesign)
- Mobile-specific touch gestures (rely on existing ReactFlow mobile support)
- Phase progress tracking or completion status (may be added in future spec)

## Expected Deliverable

1. **Interactive Phase Dashboard** - Browser-testable dashboard at `/projects/[projectId]/dashboard` showing 4 phase cards in circular arrangement with smooth zoom functionality

2. **Functional Navigation** - Click any phase to zoom in and see methods; use back button, ESC key, or click phase card to return to overview; click method to navigate to that sub-app

3. **URL State Persistence** - View state reflected in URL (e.g., `?phase=understand_context`) allowing direct links to phase detail views and browser back/forward navigation
