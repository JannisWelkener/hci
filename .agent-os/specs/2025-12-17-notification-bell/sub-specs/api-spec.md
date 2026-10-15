# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-12-17-notification-bell/spec.md

## Endpoints

### GET /api/notifications

**Purpose**: Fetch all notifications for the authenticated user with user and project information.

**Authentication**: Required (Bearer token or session cookie)

**Query Parameters**:
- `limit` (optional): Number of notifications to return (default: 50, max: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response Format**:
```json
{
  "notifications": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "creator_id": "uuid",
      "creator_name": "John Doe",
      "project_id": "uuid",
      "project_name": "HCI Research Project Alpha",
      "entity_type": "journey_map",
      "entity_count": 3,
      "action": "created",
      "created_at": "2025-12-17T14:30:00Z"
    }
  ],
  "unread_count": 5,
  "total_count": 47
}
```

**Response Fields**:
- `notifications`: Array of notification objects with denormalized user/project data
- `unread_count`: Count of notifications where creator_id != authenticated user's ID (for badge display)
- `total_count`: Total number of notifications for pagination

**Errors**:
- `401 Unauthorized`: User is not authenticated
- `500 Internal Server Error`: Database query failed

**Business Logic**:
1. Authenticate user from request session/token
2. Query notifications table WHERE user_id = authenticated user ID
3. JOIN with users/profiles table to get creator_name
4. JOIN with projects table to get project_name
5. Order by created_at DESC (newest first)
6. Calculate unread_count as COUNT where creator_id != user_id
7. Return formatted response with pagination metadata

---

### GET /api/notifications/unread-count

**Purpose**: Fetch only the unread notification count for badge display (lightweight endpoint).

**Authentication**: Required

**Query Parameters**: None

**Response Format**:
```json
{
  "unread_count": 5
}
```

**Response Fields**:
- `unread_count`: Number of notifications where creator_id != authenticated user's ID

**Errors**:
- `401 Unauthorized`: User is not authenticated
- `500 Internal Server Error`: Database query failed

**Business Logic**:
1. Authenticate user
2. Query COUNT(*) from notifications WHERE user_id = auth user AND creator_id != auth user
3. Return count only (no full notification data)

**Rationale**: This lightweight endpoint allows updating the badge count without fetching full notification data, useful for potential future polling or refresh scenarios.

---

### POST /api/notifications (Internal/System Use)

**Purpose**: Create notification entries for all project members when a Journey Map is created.

**Authentication**: Required (creator must be authenticated)

**Request Body**:
```json
{
  "project_id": "uuid",
  "entity_type": "journey_map",
  "entity_count": 1,
  "action": "created"
}
```

**Request Fields**:
- `project_id`: The project where the entity was created
- `entity_type`: Type of entity ('journey_map' for initial implementation)
- `entity_count`: Number of entities created (default: 1)
- `action`: Action performed (default: 'created')

**Response Format**:
```json
{
  "success": true,
  "notifications_created": 4
}
```

**Response Fields**:
- `success`: Boolean indicating operation success
- `notifications_created`: Number of notification rows inserted

**Errors**:
- `401 Unauthorized`: User is not authenticated
- `404 Not Found`: Project does not exist
- `403 Forbidden`: User is not a member of the project
- `400 Bad Request`: Invalid entity_type or action
- `500 Internal Server Error`: Database insertion failed

**Business Logic**:
1. Authenticate creator from request session
2. Validate project exists and creator is a member
3. Fetch all project members (user IDs)
4. Insert one notification row per project member WHERE member_id != creator_id
5. Set creator_id = authenticated user
6. Return count of inserted rows

**Usage**: This endpoint is called automatically when a Journey Map is created (e.g., in the Journey Map creation API handler or via database trigger).

---

## Alternative Implementation: Database Triggers

Instead of calling POST /api/notifications manually, consider implementing a PostgreSQL trigger:

```sql
CREATE OR REPLACE FUNCTION notify_project_members()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, creator_id, project_id, entity_type, entity_count, action)
  SELECT
    pm.user_id,
    NEW.created_by,
    NEW.project_id,
    'journey_map',
    1,
    'created'
  FROM project_members pm
  WHERE pm.project_id = NEW.project_id
    AND pm.user_id != NEW.created_by;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER journey_map_notification_trigger
AFTER INSERT ON journey_maps
FOR EACH ROW
EXECUTE FUNCTION notify_project_members();
```

**Rationale**: Database triggers ensure notifications are always created atomically with Journey Map creation, reducing application logic complexity and preventing missed notifications if the API call fails.

---

## Supabase Client Integration

Since the project uses Supabase, frontend can directly query the notifications table using Supabase client:

```typescript
// Fetch notifications with joins
const { data, error } = await supabase
  .from('notifications')
  .select(`
    *,
    creator:creator_id(id, name),
    project:project_id(id, name)
  `)
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(50);

// Get unread count
const { count } = await supabase
  .from('notifications')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', userId)
  .neq('creator_id', userId);
```

**Note**: This approach bypasses REST API endpoints and queries Supabase directly from the frontend, leveraging RLS policies for security. This is the recommended approach for initial implementation given the tech stack.
