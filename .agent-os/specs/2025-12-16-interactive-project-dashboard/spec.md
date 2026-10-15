# Spec Requirements Document

> Spec: Interactive Project Dashboard
> Created: 2025-12-16

## Overview

Create an interactive visual dashboard using a graph library that displays project progress across all HCI design artifacts (user stories, personas, user journeys, mockups, and wireframes) with navigable nodes showing real-time metrics. This dashboard serves as the central project overview page, helping students visualize their design process workflow and track completion status at a glance.

## User Stories

### Visual Project Overview

As an HCI student, I want to see a visual graph of all my project's design artifacts, so that I can understand the overall structure and progress of my human-centered design project.

The student navigates to their project overview page and sees an interactive node graph displaying all subapps (user stories, personas, user journeys, mockups, wireframes) as connected nodes. Each node shows the count of items created (e.g., "5 Personas") and when it was last updated (e.g., "Updated 2 days ago"). The graph layout automatically arranges nodes in a logical flow representing the HCI design process.

### Quick Navigation Between Design Artifacts

As an HCI student, I want to click on any node in the dashboard to navigate directly to that design artifact section, so that I can quickly access and edit the specific part of my project I'm working on.

When viewing the project dashboard, the student can click on any node (e.g., "User Stories") and immediately navigate to that subapp's page where they can view, create, or edit entries. The interaction is intuitive with visual feedback (hover states, cursor changes) indicating clickable nodes.

### Progress Tracking Across Workflow

As an HCI student, I want to see how many items I've created in each design artifact category, so that I can identify gaps in my project and ensure I'm following the complete HCI methodology.

Each node displays a count badge showing the number of items (e.g., "12 User Stories", "3 Personas", "8 Mockups"). This helps students quickly assess whether they have sufficient coverage across all design artifacts required for their project, following ISO 9241-210 standards.

## Spec Scope

1. **Interactive Node Graph** - Implement React Flow-based interactive graph with draggable nodes, zoom/pan controls, and connections between subapp nodes
2. **Progress Metrics Display** - Show item count and last updated timestamp on each node with visual badges and formatting
3. **Clickable Navigation** - Enable click-to-navigate functionality where clicking a node routes to the corresponding subapp page
4. **Five Subapp Nodes** - Create nodes for user stories, personas, user journeys, mockups, and wireframes with appropriate icons and styling
5. **Responsive Design** - Ensure dashboard layout works across desktop, tablet, and mobile devices with Tailwind CSS responsive utilities

## Out of Scope

- Real-time collaborative editing or live updates when other users make changes
- Drag-and-drop to reorder or reorganize project workflow
- Export dashboard as image/PDF
- Custom graph layouts or manual node positioning by users
- Filtering or search within the dashboard view
- Detailed analytics or historical progress tracking over time

## Expected Deliverable

1. A functional project overview page at `/projects/[id]/dashboard` displaying an interactive React Flow graph with all five subapp nodes
2. Each node displays accurate count metrics and last updated information fetched from the database
3. Clicking any node navigates to the corresponding subapp page (e.g., clicking "User Stories" navigates to `/projects/[id]/user-stories`)
