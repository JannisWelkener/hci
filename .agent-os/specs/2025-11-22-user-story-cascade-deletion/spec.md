# Spec Requirements Document

> Spec: User Story Cascade Deletion with Journey Map Dependencies
> Created: 2025-11-22

## Overview

Enhance the user story deletion process to detect and handle dependencies with user journey maps, providing users with clear warnings about affected journey maps and automatically performing cascade deletion to maintain data integrity. This improvement prevents orphaned journey map references and gives users full visibility into the impact of deleting a user story.

## User Stories

### Safe User Story Deletion

As a project member, I want to see which journey maps will be affected before deleting a user story, so that I can make an informed decision about the deletion and understand its full impact on my project.

**Workflow:** When a user clicks delete on a user story, the system checks if that story is referenced in any user journey map timelines. If dependencies exist, a warning dialog displays a list of all affected journey maps with their titles. Each journey map entry includes a link to navigate and view that specific journey map. The user can review the affected maps before confirming the deletion. Upon confirmation, both the user story and all dependent journey maps are deleted in a single transaction to maintain data consistency.

### Prevent Data Integrity Issues

As a system administrator, I want user story deletions to automatically clean up related journey map references, so that the database maintains referential integrity without orphaned records.

**Workflow:** When a user story is deleted, the system executes a cascading delete operation that removes all user journey map timeline entries referencing that story, and then deletes any journey maps that become invalid. This ensures that no journey maps exist with broken references to deleted user stories, maintaining database consistency and preventing potential application errors.

## Spec Scope

1. **Dependency Detection API** - Create a new API endpoint that checks if a user story is referenced in any journey map timelines and returns the list of affected journey maps.

2. **Enhanced Delete Dialog UI** - Modify the user story deletion dialog to display a warning section listing all affected journey maps with navigation links when dependencies are detected.

3. **Cascade Delete Backend Logic** - Implement server-side logic to perform atomic cascade deletion of user stories and their dependent journey maps within a database transaction.

4. **Frontend Hook Enhancement** - Update the `useDeleteUserStory` hook to fetch dependency information before deletion and pass it to the delete dialog component.

5. **Navigation Integration** - Add clickable journey map links in the warning dialog that open the respective journey map in a new tab or modal for review.

## Out of Scope

- Allowing users to choose between cascade deletion and removing the story from timeline only (always cascade delete)
- Undo functionality for cascade deletions
- Bulk deletion of multiple user stories with dependency checking
- Archiving user stories instead of permanent deletion
- Email notifications to team members about cascade deletions
- Audit log or history tracking for cascade deletions

## Expected Deliverable

1. **Functional Dependency Warning Dialog** - When deleting a user story that's referenced in journey maps, users see a dialog listing all affected journey maps (with titles and navigation links) before confirming deletion.

2. **Cascade Deletion Execution** - Upon confirmation, both the user story and all listed journey maps are successfully deleted from the database, with no orphaned references remaining.

3. **Successful Non-Dependent Deletion** - User stories without journey map dependencies can still be deleted normally without showing the warning section, maintaining the existing simple deletion flow.
