# Spec Requirements Document

> Spec: User Story Dependency Cleanup on Deletion
> Created: 2025-12-07

## Overview

Implement automatic detection and cleanup of incoming user story dependencies to prevent orphaned references when deleting stories. This enhancement will display dependent stories in the deletion dialog as warnings (similar to journey map dependencies) and automatically remove all dependency references when deletion is confirmed, ensuring complete data integrity across the project.

## User Stories

### Prevent Broken Dependency Chains

As a project manager, I want to see which user stories depend on the story I'm about to delete, so that I can understand the impact of my deletion and avoid breaking dependency chains in my project.

**Workflow:** When a user clicks the delete button for a user story, the system detects all stories that reference the target story in their dependencies array (incoming dependencies). These dependent stories are displayed in the deletion dialog with their title, status, priority, and a link to view them. The user can review the impact before confirming deletion. The dialog updates the button text to clearly indicate that dependencies will be updated (e.g., "Delete Story & Update 3 Dependencies" when there are both story and journey map dependencies).

### Automatic Dependency Reference Cleanup

As a developer using the HCI Hub, I want orphaned dependency references to be automatically cleaned up when I delete a story, so that I don't have broken references pointing to non-existent stories.

**Workflow:** When a user confirms deletion of a story that has incoming dependencies, the system automatically removes the deleted story's ID from all dependent stories' dependencies arrays. This happens atomically as part of the deletion transaction, ensuring data consistency. The user receives confirmation that both the story and all dependency references have been cleaned up.

### Consistent Warning Experience

As a user familiar with the journey map deletion warnings, I want dependency warnings to follow the same visual pattern, so that I can quickly understand the impact of deletions across different artifact types.

**Workflow:** The dependent stories warning section mirrors the existing journey map dependencies warning design, with a scrollable list of affected items, consistent typography, spacing, and interaction patterns. Users see a unified deletion experience whether dependencies involve journey maps, user stories, or both.

## Spec Scope

1. **Incoming Dependency Detection** - Create an API endpoint to detect all user stories that reference a target story in their dependencies array.

2. **Deletion Dialog Enhancement** - Update user story deletion dialogs to display incoming story dependencies with title, status, priority, and view links.

3. **Automatic Reference Cleanup** - Implement server-side logic to remove deleted story references from all dependent stories' dependencies arrays during deletion.

4. **Dynamic Button Text** - Update deletion confirmation button text to reflect both journey map and story dependency counts.

5. **Consistent UI Pattern** - Ensure dependency warnings match the existing journey map dependency warning design for visual consistency.

## Out of Scope

- Dependency type-specific deletion behavior (all dependency types are treated equally)
- User choice to keep some dependency references while removing others
- Cascade deletion of dependent stories (only references are removed, not the stories themselves)
- Dependency validation to prevent creating dependencies to stories that will be deleted
- Undo functionality for dependency cleanup after deletion
- Notification system to alert owners of dependent stories about the cleanup

## Expected Deliverable

1. **Functional Dependency Detection**: When attempting to delete a user story with incoming dependencies, the deletion dialog displays all dependent stories with their title, user role/action, status, priority, and a clickable link to view each story.

2. **Automatic Cleanup on Deletion**: After confirming deletion of a user story, all references to that story are automatically removed from other stories' dependencies arrays, verified by checking that no orphaned dependency references remain in the database.

3. **Consistent User Experience**: The dependency warning section in the deletion dialog visually matches the existing journey map dependency warnings, with the confirmation button text dynamically updating to show the total impact (e.g., "Delete Story & 2 Journey Maps & Update 3 Dependencies").
