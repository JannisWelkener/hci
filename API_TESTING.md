# API Testing Guide

This guide shows you how to test the HCI Hub API endpoints.

## Prerequisites

1. **Start the development server:**
   ```bash
   npm run dev
   ```
   Server runs at: http://localhost:3000

2. **Run the database migration:**
   See `supabase/RUN_MIGRATION.md` for instructions

3. **Ensure you're logged in:**
   - Navigate to http://localhost:3000
   - Sign in with your Supabase credentials
   - Your session cookie will be set automatically

## Method 1: Using Browser DevTools Console

Open your browser's DevTools (F12) and use the Console tab:

### Test GET /api/projects
```javascript
fetch('/api/projects')
  .then(r => r.json())
  .then(console.log)
```

### Test POST /api/projects
```javascript
fetch('/api/projects', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Test Project',
    description: 'Testing the API',
    start_date: '2025-10-07'
  })
})
  .then(r => r.json())
  .then(console.log)
```

### Test GET /api/projects/[id]
```javascript
// Replace PROJECT_ID with actual project ID from previous request
fetch('/api/projects/PROJECT_ID')
  .then(r => r.json())
  .then(console.log)
```

### Test PATCH /api/projects/[id]
```javascript
fetch('/api/projects/PROJECT_ID', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Updated Project Name'
  })
})
  .then(r => r.json())
  .then(console.log)
```

### Test DELETE /api/projects/[id]
```javascript
fetch('/api/projects/PROJECT_ID', {
  method: 'DELETE'
})
  .then(r => r.json())
  .then(console.log)
```

### Test POST /api/projects/[id]/members
```javascript
fetch('/api/projects/PROJECT_ID/members', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: 'USER_UUID',
    role: 'member'
  })
})
  .then(r => r.json())
  .then(console.log)
```

### Test DELETE /api/projects/[id]/members/[userId]
```javascript
fetch('/api/projects/PROJECT_ID/members/USER_UUID', {
  method: 'DELETE'
})
  .then(r => r.json())
  .then(console.log)
```

### Test PATCH /api/projects/[id]/phases
```javascript
fetch('/api/projects/PROJECT_ID/phases', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phase: 'understand_context',
    status: 'in_progress'
  })
})
  .then(r => r.json())
  .then(console.log)
```

## Method 2: Using cURL (Command Line)

**Note:** You need to copy the session cookie from your browser first.

1. Open DevTools ’ Application/Storage ’ Cookies
2. Find cookies for localhost:3000
3. Copy the Supabase session cookies

### GET /api/projects
```bash
curl http://localhost:3000/api/projects \
  -H "Cookie: YOUR_SESSION_COOKIE"
```

### POST /api/projects
```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -H "Cookie: YOUR_SESSION_COOKIE" \
  -d '{
    "name": "Test Project",
    "description": "Testing the API",
    "start_date": "2025-10-07"
  }'
```

### With query parameters
```bash
curl "http://localhost:3000/api/projects?page=1&limit=10&sort=created_at&order=desc" \
  -H "Cookie: YOUR_SESSION_COOKIE"
```

## Method 3: Using Postman or Thunder Client

### Thunder Client (VS Code Extension - Recommended)

1. Install "Thunder Client" extension in VS Code
2. Open Thunder Client (sidebar icon)
3. Create a new request
4. Set the request details:
   - Method: GET, POST, PATCH, or DELETE
   - URL: http://localhost:3000/api/projects
   - Headers: Cookies will be sent automatically if you're logged in
   - Body: JSON for POST/PATCH requests

### Postman

1. Download Postman: https://www.postman.com/downloads/
2. Create a new request
3. Import cookies from browser or set manually
4. Make requests to http://localhost:3000/api/...

## Method 4: Create a Test Page

Create a simple test page in your Next.js app:

```typescript
// app/test-api/page.tsx
'use client'

import { useState } from 'react'

export default function TestApiPage() {
  const [result, setResult] = useState<any>(null)

  const testGetProjects = async () => {
    const res = await fetch('/api/projects')
    const data = await res.json()
    setResult(data)
  }

  const testCreateProject = async () => {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Project ' + Date.now(),
        description: 'Created from test page',
        start_date: new Date().toISOString().split('T')[0]
      })
    })
    const data = await res.json()
    setResult(data)
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">API Testing</h1>

      <div className="space-y-2 mb-4">
        <button
          onClick={testGetProjects}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Test GET /api/projects
        </button>

        <button
          onClick={testCreateProject}
          className="px-4 py-2 bg-green-500 text-white rounded ml-2"
        >
          Test POST /api/projects
        </button>
      </div>

      <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
        {JSON.stringify(result, null, 2)}
      </pre>
    </div>
  )
}
```

Then visit: http://localhost:3000/test-api

## Expected Response Format

All endpoints return this format:

### Success Response
```json
{
  "data": {
    // Your data here
  },
  "error": null
}
```

### Error Response
```json
{
  "data": null,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}
```

## Common Issues & Solutions

### 401 Unauthorized
- **Problem:** Not logged in
- **Solution:** Go to http://localhost:3000 and sign in first

### 404 Not Found
- **Problem:** Invalid project ID or resource doesn't exist
- **Solution:** Use a valid UUID from a created project

### 403 Forbidden
- **Problem:** You don't have permission (e.g., trying to delete someone else's project)
- **Solution:** Only perform operations on your own projects

### 500 Internal Server Error
- **Problem:** Server error, possibly database migration not run
- **Solution:** Check server console for error logs, verify migration is applied

## Testing Workflow

1. **Create a project:**
   ```javascript
   POST /api/projects
   ```
   Save the returned `id`

2. **List projects:**
   ```javascript
   GET /api/projects
   ```

3. **Get single project:**
   ```javascript
   GET /api/projects/{id}
   ```

4. **Update project:**
   ```javascript
   PATCH /api/projects/{id}
   ```

5. **Update phase:**
   ```javascript
   PATCH /api/projects/{id}/phases
   ```

6. **Add member (if you have another user):**
   ```javascript
   POST /api/projects/{id}/members
   ```

7. **Delete project:**
   ```javascript
   DELETE /api/projects/{id}
   ```

## Quick Test Script

Save this as `test-api.js` and run with Node.js:

```javascript
// test-api.js
// NOTE: You need to manually set the SESSION_COOKIE

const SESSION_COOKIE = 'YOUR_SESSION_COOKIE_HERE'
const BASE_URL = 'http://localhost:3000'

async function testAPI() {
  // Create project
  const createRes = await fetch(`${BASE_URL}/api/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': SESSION_COOKIE
    },
    body: JSON.stringify({
      name: 'Test Project',
      description: 'API Test',
      start_date: '2025-10-07'
    })
  })
  const project = await createRes.json()
  console.log('Created:', project)

  if (project.data) {
    // Get project
    const getRes = await fetch(`${BASE_URL}/api/projects/${project.data.id}`, {
      headers: { 'Cookie': SESSION_COOKIE }
    })
    const retrieved = await getRes.json()
    console.log('Retrieved:', retrieved)

    // Update phase
    const phaseRes = await fetch(`${BASE_URL}/api/projects/${project.data.id}/phases`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': SESSION_COOKIE
      },
      body: JSON.stringify({
        phase: 'understand_context',
        status: 'in_progress'
      })
    })
    const updated = await phaseRes.json()
    console.log('Phase updated:', updated)
  }
}

testAPI()
```

Run it:
```bash
node test-api.js
```

---

**Recommendation:** Use **Method 1 (Browser DevTools)** for quick testing - it's the fastest and doesn't require any setup!
