# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-12-17-notification-bell/spec.md

## New Table: notifications

Create a new `notifications` table to store project activity notifications for Journey Map changes.

### Table Structure

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL,
  entity_count INTEGER NOT NULL DEFAULT 1,
  action VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_entity_type CHECK (entity_type IN ('journey_map', 'persona', 'user_story', 'prototype')),
  CONSTRAINT valid_action CHECK (action IN ('created', 'updated', 'deleted')),
  CONSTRAINT positive_count CHECK (entity_count > 0)
);
```

### Column Descriptions

- **id**: Unique identifier for each notification
- **user_id**: The recipient user who will see this notification (project member)
- **creator_id**: The user who performed the action (created the Journey Map)
- **project_id**: The project where the change occurred
- **entity_type**: Type of entity changed (currently only 'journey_map' will be used)
- **entity_count**: Number of entities affected in this notification (e.g., if user created 3 Journey Maps, count = 3)
- **action**: The action performed ('created' for initial implementation)
- **created_at**: Timestamp when the notification was created

### Indexes

```sql
-- Index for fetching user's notifications efficiently
CREATE INDEX idx_notifications_user_id_created_at
ON notifications(user_id, created_at DESC);

-- Index for filtering by project
CREATE INDEX idx_notifications_project_id
ON notifications(project_id);

-- Index for creator filtering (to exclude own changes from badge count)
CREATE INDEX idx_notifications_creator_id
ON notifications(creator_id);

-- Composite index for common query pattern (user's notifications excluding own)
CREATE INDEX idx_notifications_user_creator_project
ON notifications(user_id, creator_id, project_id, created_at DESC);
```

### Row-Level Security (RLS) Policies

```sql
-- Enable RLS on notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only view notifications where they are the recipient
CREATE POLICY "Users can view their own notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id);

-- Allow system to insert notifications for all project members
CREATE POLICY "System can insert notifications"
ON notifications FOR INSERT
WITH CHECK (true);

-- Prevent users from deleting or updating notifications
-- (Future: may allow marking as read)
```

### Rationale

**Recipient-based storage**: Each notification is stored per recipient (user_id), not as a single event. When a Journey Map is created, a notification row is inserted for each project member (excluding the creator). This enables efficient querying of a user's personal notification feed without complex joins.

**Creator tracking**: Storing creator_id separately allows badge count calculation that excludes the user's own changes while still displaying them in the notification list.

**Entity count aggregation**: The entity_count field allows batching multiple entity creations into a single notification message (e.g., "User X created (3) Journey Maps") for better UX and reduced database rows.

**Timestamping**: The created_at field enables chronological ordering and potential future features like "show notifications from last 30 days."

**Constraint validation**: CHECK constraints ensure data integrity for entity_type and action values, preventing invalid data entry.

**Performance optimization**: Multiple indexes support different query patterns (user feed, project filtering, creator exclusion) with DESC ordering on created_at for efficient newest-first retrieval.

**Cascade deletion**: ON DELETE CASCADE ensures notifications are automatically cleaned up when users or projects are deleted, maintaining referential integrity.

**Extensibility**: The entity_type field supports future expansion to other entity types (personas, user stories, etc.) without schema changes.

## Migration Notes

- Migration should be run before deploying the notification bell feature
- Existing projects will start with zero notifications (no historical backfill)
- Future Journey Map creations will automatically generate notifications via application logic or database triggers
- Consider adding a database trigger to auto-generate notification rows when journey_maps table receives INSERTs
