# Spec Requirements Document

> Spec: Notification Bell System
> Created: 2025-12-17

## Overview

Implement a notification bell component in the dashboard header that tracks and displays Journey Map changes across projects, showing team members' activities with a badge counter for unread notifications. This feature enables users to stay informed about project updates without active monitoring, displaying a persistent history of all changes accessible through a dropdown interface.

## User Stories

### Stay Informed About Team Activity

As a team member working on collaborative HCI projects, I want to see when my teammates create or modify Journey Maps, so that I can stay up-to-date with project progress without constantly checking each project individually.

**Workflow**: User logs into HCI Hub and sees the notification bell icon in the dashboard header with an orange badge showing "5" unread notifications. They click the bell and see a dropdown listing recent changes: "User X created (1) Journey Map in Project Alpha" and "User Y created (4) Journey Maps in Project Beta". The badge count reflects only changes made by others, not the user's own changes. After viewing, the user can see the complete notification history, even after logging out and back in.

### Track Project History Across Sessions

As a project member who doesn't log in daily, I want to view all historical notifications from my projects, so that I can catch up on what happened while I was away and understand the full context of recent changes.

**Workflow**: User returns to HCI Hub after several days and clicks the notification bell. The dropdown displays all accumulated notifications from their project memberships, showing a chronological history of Journey Map creations by team members. Notifications persist across sessions, allowing the user to scroll through and review all past activities without losing any information.

## Spec Scope

1. **Notification Bell Component** - Display a bell icon with an orange badge counter in the dashboard header that shows unread notification count (excluding user's own changes).

2. **Journey Map Change Tracking** - Track and store all Journey Map creation events with user attribution, project context, and timestamp in a persistent database table.

3. **Dropdown Notification List** - Show a reusable dropdown component displaying formatted notification messages with user names, entity counts, and project names when bell is clicked.

4. **Project-Based Filtering** - Display only notifications from projects where the current user is a member, ensuring proper access control and relevance.

5. **Persistent Notification History** - Store all notifications in the database for permanent access, allowing users to view complete project activity history across all login sessions.

## Out of Scope

- Real-time notification updates (will refresh only on page load/refresh)
- Invitation notifications (reserved for future implementation)
- Notification deletion or manual marking as read
- Push notifications or email notifications
- Tracking changes to other entity types beyond Journey Maps
- Notification filtering or search functionality
- Configurable notification preferences

## Expected Deliverable

1. A functional notification bell icon appears in the dashboard header with a dynamically updated orange badge showing the count of notifications from other users' Journey Map changes.

2. Clicking the bell displays a dropdown list of all notifications with properly formatted messages showing creator name, entity count, and project name, persisting across user sessions.

3. The system correctly filters notifications to show only changes from projects the user is a member of, and excludes the user's own changes from the badge count while keeping them visible in the history list.
