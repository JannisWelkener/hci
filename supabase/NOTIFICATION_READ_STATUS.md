# Notification Read Status Feature

## Overview

This feature adds read/unread tracking to notifications. When you open the notification dropdown, all unread notifications are automatically marked as read, and the badge count updates accordingly.

## How It Works

### User Experience

1. **Unread Notifications**:
   - Bell icon shows an orange badge with count of unread notifications
   - Count only includes notifications from OTHER users (your own changes don't count)
   - Unread notifications appear with a subtle background highlight

2. **Opening the Dropdown**:
   - Click the bell icon to open the notification list
   - All unread notifications are automatically marked as read
   - Badge count updates to 0 (or the count of new notifications received since opening)

3. **Notification History**:
   - All notifications remain in the list (both read and unread)
   - You can see the full history of project changes
   - Notifications are ordered by newest first

### Technical Implementation

**Database Changes** (Migration 012):
- Adds `read` boolean column to `notifications` table (defaults to `false`)
- Creates index for efficient querying: `idx_notifications_user_id_read_created_at`
- Adds RLS policy to allow users to update their own notifications' read status

**Frontend Changes**:
- `useNotifications` hook now fetches the `read` field
- Unread count calculated as: `!notification.read && notification.creator_id !== user.id`
- New `useMarkNotificationsRead` hook marks all unread notifications as read
- `NotificationBell` component automatically calls mark-as-read when dropdown opens

## Migration Instructions

### Apply Migration

Go to **Supabase SQL Editor** and run:

```sql
-- Copy and paste the contents of:
supabase/migrations/20251217012_add_notification_read_status.sql
```

### Verify Migration

```sql
-- Check that read column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'notifications' AND column_name = 'read';

-- Expected result:
-- column_name | data_type | column_default
-- read        | boolean   | false

-- Check RLS policy exists
SELECT policyname FROM pg_policies
WHERE tablename = 'notifications'
  AND policyname = 'Users can update own notifications read status';
```

## Rollback

If you need to rollback this feature:

```sql
-- Copy and paste the contents of:
supabase/migrations/20251217013_rollback_notification_read_status.sql
```

## Behavior Details

### What Counts as "Unread"

A notification is unread if:
- `read = false` (hasn't been viewed yet)
- AND `creator_id !== user_id` (notification is from someone else)

Your own notifications appear in the list but don't show in the badge count.

### When Notifications Are Marked as Read

Notifications are marked as read when:
- User opens the notification dropdown
- Only if there are unread notifications (`unreadCount > 0`)
- All unread notifications are marked as read in a single database update

### Visual Indicators

- **Unread notifications**: Subtle background highlight (`bg-accent/10`)
- **Read notifications**: No background highlight
- **Badge**: Shows count of unread notifications from others

## Database Schema

```sql
-- notifications table structure
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL,
  entity_count INTEGER NOT NULL DEFAULT 1,
  action VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read BOOLEAN NOT NULL DEFAULT false  -- NEW COLUMN
);

-- Index for efficient unread queries
CREATE INDEX idx_notifications_user_id_read_created_at
ON public.notifications(user_id, read, created_at DESC);
```

## API Changes

### Query Changes

Before:
```typescript
const unreadCount = notifications.filter(n => n.creator_id !== user.id).length
```

After:
```typescript
const unreadCount = notifications.filter(n => !n.read && n.creator_id !== user.id).length
```

### New Hook

```typescript
import { useMarkNotificationsRead } from '@/lib/hooks/use-mark-notifications-read'

const markAsReadMutation = useMarkNotificationsRead()

// Mark all unread notifications as read
markAsReadMutation.mutate()
```

## Testing

1. **Create a notification** (from another user account in a shared project)
2. **Check badge count** - should show 1 unread
3. **Open dropdown** - notifications list appears
4. **Close and reopen** - badge count should be 0
5. **Create another notification** - badge count increases again

## Notes

- Existing notifications in the database will default to `read = false` (unread)
- The read status is per-user (each user has their own read/unread state)
- Marking as read happens client-side when dropdown opens
- If multiple notifications arrive while dropdown is open, they will be marked as read when you close and reopen
