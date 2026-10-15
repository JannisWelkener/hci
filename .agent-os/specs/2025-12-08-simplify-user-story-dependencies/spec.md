# Spec Requirements Document

> Spec: Simplify User Story Dependencies
> Created: 2025-12-08

## Overview

Simplify the user story dependency system by removing the dependency type classification (blocks, requires, relates_to) and converting to a simple list of dependent story IDs. This streamlines the dependency management UI, reduces cognitive overhead for users, and simplifies the data model while maintaining the essential functionality of tracking relationships between user stories.

## User Stories

### Simplified Dependency Management

As an HCI student managing user stories, I want to add dependencies without choosing a type, so that I can quickly link related stories without overthinking the nature of their relationship.

**Workflow:** When creating or editing a user story, the student clicks "Add dependency" and selects related stories from a searchable list. The dependencies are saved as simple references without requiring classification. When viewing dependencies, students see a clean list of linked stories with basic information (title, priority, status) and can navigate between them easily.

### Cleaner Dependency Visualization

As a project team member, I want to see story dependencies in a simple, uncluttered format, so that I can quickly understand story relationships without processing unnecessary metadata.

**Workflow:** When viewing a user story detail page or dependency list, team members see dependent stories displayed with essential information only (title, description snippet, priority, status). The interface focuses on the stories themselves rather than categorizing the type of relationship, making it easier to scan and understand dependencies at a glance.

## Spec Scope

1. **Data Model Simplification** - Convert dependencies from array of objects with `story_id` and `type` to simple array of story ID strings
2. **UI Component Updates** - Remove dependency type selectors and labels from DependencySelector, DependencyList, and DependencyBadge components
3. **API & Validation Updates** - Update validation schemas, TypeScript types, and API response formats to remove dependency type
4. **Database Migration** - Create migration to transform existing dependency data from `[{story_id, type}]` to `[story_id]` format
5. **Backwards Compatibility** - Ensure journey map functionality and existing dependency relationships remain intact after migration

## Out of Scope

- Adding new dependency features or relationship types
- Changing how dependencies are displayed in user journey maps (journey maps only reference stories via timeline table)
- Implementing dependency visualization graphs or advanced dependency analysis
- Adding bi-directional dependency enforcement or validation rules

## Expected Deliverable

1. User story form allows adding/removing dependencies without type selection, showing only story search and selection UI
2. Dependency list displays linked stories with title, priority, and status badges in a clean, type-free format
3. All existing user story dependencies are successfully migrated to new format with no data loss
4. TypeScript compilation passes with updated types, and all dependency-related UI components render correctly
