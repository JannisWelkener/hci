# Spec Requirements Document

> Spec: User Story Priority Ordering Cleanup
> Created: 2025-12-06

## Overview

Simplify the user story priority ordering system by switching from 1000-increment gaps to clean sequential numbering (1, 2, 3...) and streamline the creation forms by removing the optional description field from manual entry mode while preserving it for AI-assisted generation.

## User Stories

### Simplified Priority Management

As a project manager, I want user stories to be numbered sequentially (1, 2, 3...) instead of using large gaps (1000, 2000, 3000), so that the priority order is immediately clear and easy to understand at a glance.

**Workflow:**
- User opens the user stories page and sees stories with priority_order values of 1, 2, 3, 4, etc.
- When user drags a story from position 5 to position 2, the system automatically renumbers all affected stories to maintain sequential order
- The UI displays clean numbers without large gaps, making it easier to reference specific priorities in team discussions

### Streamlined Manual Story Creation

As a UX designer, I want the manual user story creation form to be focused on the core user story format (role, action, benefit) without optional description fields, so that I can quickly create stories without unnecessary fields.

**Workflow:**
- User clicks "Create User Story" and selects "Manual" mode
- Form displays only essential fields: title, user_role, action, benefit, acceptance_criteria, priority, status, story_points, dependencies
- Description field is not shown in manual mode, reducing form complexity
- When user switches to "AI" mode, the description field appears as it's required for AI generation
- User can efficiently create manual stories without encountering irrelevant fields

## Spec Scope

1. **Priority Order Renumbering** - Modify drag-and-drop reordering to use sequential numbers (1, 2, 3...) instead of 1000-increment gaps
2. **Database Migration** - Update existing priority_order values to sequential numbering without breaking existing data
3. **API Endpoint Update** - Modify the reorder endpoint to calculate sequential priority_order values
4. **Form Field Removal** - Remove optional description field from manual mode in UserStoryFormEnhanced component
5. **Form Conditional Logic** - Ensure description field remains visible and required in AI generation mode

## Out of Scope

- Changes to the priority enum field (low, medium, high, critical) - this remains separate from priority_order
- Modifications to story points, status, or dependency functionality
- Changes to the AI generation algorithm or endpoint logic
- Updates to UserStoryForm component (used for editing, not creation)
- Bulk operations for renumbering priorities outside of drag-and-drop

## Expected Deliverable

1. User stories display with sequential priority_order (1, 2, 3...) in the table view
2. Drag-and-drop reordering updates all affected stories to maintain sequential numbering
3. Manual user story creation form (UserStoryFormEnhanced in manual mode) does not show description field
4. AI user story creation form (UserStoryFormEnhanced in AI mode) continues to show and require description field
5. All existing user stories have been migrated to sequential priority_order values
