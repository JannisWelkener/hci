# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-12-16-interactive-project-dashboard/spec.md

## Endpoints

### GET /api/projects/[id]/stats

**Purpose:** Fetch aggregated statistics for all subapps within a specific project to display on the dashboard.

**Parameters:**
- `id` (path parameter, UUID): The project ID

**Authentication:** Required - User must be authenticated and have access to the specified project

**Response Format:**
```typescript
{
  success: boolean;
  data: {
    userStories: {
      count: number;
      lastUpdated: string | null; // ISO 8601 timestamp
    };
    personas: {
      count: number;
      lastUpdated: string | null;
    };
    userJourneys: {
      count: number;
      lastUpdated: string | null;
    };
    mockups: {
      count: number;
      lastUpdated: string | null;
    };
    wireframes: {
      count: number;
      lastUpdated: string | null;
    };
  };
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "userStories": {
      "count": 12,
      "lastUpdated": "2025-12-14T10:30:00.000Z"
    },
    "personas": {
      "count": 3,
      "lastUpdated": "2025-12-10T15:45:00.000Z"
    },
    "userJourneys": {
      "count": 5,
      "lastUpdated": "2025-12-12T08:20:00.000Z"
    },
    "mockups": {
      "count": 8,
      "lastUpdated": "2025-12-15T14:00:00.000Z"
    },
    "wireframes": {
      "count": 0,
      "lastUpdated": null
    }
  }
}
```

**Errors:**

- **401 Unauthorized**: User is not authenticated
  ```json
  {
    "success": false,
    "error": "Unauthorized - Please log in"
  }
  ```

- **403 Forbidden**: User does not have access to this project
  ```json
  {
    "success": false,
    "error": "Forbidden - You do not have access to this project"
  }
  ```

- **404 Not Found**: Project does not exist
  ```json
  {
    "success": false,
    "error": "Project not found"
  }
  ```

- **500 Internal Server Error**: Database or server error
  ```json
  {
    "success": false,
    "error": "Internal server error"
  }
  ```

**Implementation Notes:**
- Endpoint should execute parallel database queries for all five subapps to minimize latency
- Use database connection pooling to handle concurrent requests efficiently
- Cache responses for 30-60 seconds to reduce database load (optional, can use React Query's stale time)
- Ensure proper row-level security policies are enforced in Supabase queries

**Example Usage:**
```typescript
// Using TanStack Query
const { data, isLoading, error } = useQuery({
  queryKey: ['projectStats', projectId],
  queryFn: async () => {
    const response = await fetch(`/api/projects/${projectId}/stats`);
    if (!response.ok) throw new Error('Failed to fetch project stats');
    return response.json();
  },
  staleTime: 60000, // Consider data fresh for 1 minute
});
```
