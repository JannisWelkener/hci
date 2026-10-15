# Spec Requirements Document

> Spec: User Story Dependencies Fix
> Created: 2025-11-16

## Overview

Fix the user story dependencies feature by implementing functional search filtering in the DependencySelector component and integrating the DependencyList component into the user story detail view. This will enable users to efficiently find and add story dependencies while also viewing existing dependencies when reviewing individual user stories.

## User Stories

### Dependency Search and Selection

As a project manager, I want to search and filter user stories when adding dependencies, so that I can quickly find the relevant stories without scrolling through a long list.

When creating or editing a user story, users can click the "Add dependency..." button to open a popover with a search input and list of available stories. As they type in the search field, the list should filter in real-time to show only stories whose title or user story description (user role + action) match the search query. This allows users to efficiently find stories even in projects with dozens or hundreds of user stories.

### View Story Dependencies

As a project team member, I want to see all dependencies when viewing a user story detail page, so that I understand what other stories are related and can plan my work accordingly.

When viewing a user story's detail page, users should see a dedicated dependencies card below the main story information. This card displays both outgoing dependencies (stories this one depends on) and incoming dependencies (stories that depend on this one), grouped and clearly labeled. Each dependency shows the relationship type (blocks, requires, relates to), the linked story's title and summary, and allows clicking to navigate to that story's detail page.

## Spec Scope

1. **DependencySelector Search Fix** - Implement proper search filtering in the CommandInput to filter stories by title and user story description fields.
2. **DependencyList Integration** - Add the DependencyList component to the UserStoryDetail component to display all dependencies.
3. **Dependency Data Fetching** - Implement hooks and API calls to fetch dependency information with full story details for both outgoing and incoming dependencies.
4. **Navigation Support** - Enable clicking on dependency items to navigate to the linked story's detail page.

## Out of Scope

- Creating new dependency types or modifying the dependency data model
- Bulk dependency management or advanced dependency visualization (e.g., dependency graphs)
- Dependency validation or circular dependency detection
- Editing or deleting dependencies from the detail view (only viewing)

## Expected Deliverable

1. Users can type in the dependency search field and see the story list filter in real-time by matching title and user story description.
2. When viewing a user story detail page, a dependencies card is visible showing all outgoing and incoming dependencies with proper labels and story information.
3. Clicking on a dependency in the detail view navigates to that story's detail page.
