# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-12-08-ai-project-description/spec.md

## Endpoints

### POST /api/ai/generate-description

**Purpose:** Generate or enhance a project description using OpenAI based on project name and optional existing description.

**Authentication:** Required (authenticated user session)

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```typescript
{
  projectName: string;           // Required, 1-200 characters
  currentDescription?: string;   // Optional, 0-2000 characters
}
```

**Request Example:**
```json
{
  "projectName": "Smart Home Accessibility Study",
  "currentDescription": "A study about making smart homes more accessible"
}
```

**Success Response (200 OK):**
```typescript
{
  description: string;  // Generated description, max 2000 characters
}
```

**Success Response Example:**
```json
{
  "description": "The Smart Home Accessibility Study aims to investigate and improve the usability of smart home technologies for users with diverse abilities, particularly focusing on elderly individuals and people with disabilities. This project will examine current barriers in smart home interfaces and develop user-centered design recommendations to enhance accessibility and independence for all users.\n\nOur research will target homeowners aged 60+ and individuals with mobility, visual, or hearing impairments who currently use or are interested in smart home technology. Through user interviews, usability testing, and heuristic evaluations following ISO 9241-210 human-centered design principles, we will identify pain points and opportunities for improvement in existing smart home ecosystems.\n\nExpected outcomes include a comprehensive accessibility audit of popular smart home platforms, a set of design guidelines for inclusive smart home interfaces, and low-fidelity prototypes demonstrating accessible interaction patterns. This work will contribute to the broader field of inclusive design and provide actionable insights for smart home manufacturers and UX practitioners."
}
```

**Error Responses:**

**400 Bad Request** - Invalid input
```json
{
  "error": "Project name is required",
  "code": "MISSING_PROJECT_NAME"
}
```
```json
{
  "error": "Project name must be 200 characters or less",
  "code": "PROJECT_NAME_TOO_LONG"
}
```
```json
{
  "error": "Description must be 2000 characters or less",
  "code": "DESCRIPTION_TOO_LONG"
}
```

**401 Unauthorized** - User not authenticated
```json
{
  "error": "Authentication required",
  "code": "UNAUTHORIZED"
}
```

**429 Too Many Requests** - Rate limit exceeded (optional enhancement)
```json
{
  "error": "Too many requests. Please try again later.",
  "code": "RATE_LIMIT_EXCEEDED"
}
```

**500 Internal Server Error** - OpenAI API failure
```json
{
  "error": "AI service temporarily unavailable. Please try again.",
  "code": "AI_SERVICE_ERROR"
}
```

**504 Gateway Timeout** - Request timeout (30 seconds)
```json
{
  "error": "Description generation timed out. Please try again.",
  "code": "TIMEOUT"
}
```

## Implementation Details

### Route Handler Structure

**File:** `/app/api/ai/generate-description/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  // 1. Authentication check
  // 2. Parse and validate request body
  // 3. Initialize OpenAI client with abort controller
  // 4. Generate description with timeout
  // 5. Return response or handle errors
}
```

### OpenAI Integration

**Model:** `gpt-4o-mini`
**Temperature:** 0.7
**Max Tokens:** 800
**Timeout:** 30 seconds

**Prompt Structure:**
```typescript
const systemPrompt = `You are an assistant helping HCI and UX Design students write project descriptions for their human-centered design projects. Generate clear, comprehensive descriptions that are academically appropriate but not overly formal.`;

const userPrompt = `Given a project name${currentDescription ? ' and existing description' : ''}, generate a clear, comprehensive project description that includes:
- Project goals and objectives
- Target users or stakeholders
- Scope boundaries (what's included)
- Expected outcomes
- Relevant HCI/UX methodology context (based on ISO 9241-210 if applicable)

DO NOT include timeline, milestones, or specific dates.

Use a balanced, professional tone suitable for academic projects. Keep the description to 2-3 paragraphs (approximately 200-400 words).

Project Name: ${projectName}
${currentDescription ? `Current Description: ${currentDescription}` : ''}

Generate the enhanced project description:`;
```

### Error Handling Flow

1. **Validation Errors (400):**
   - Check `projectName` exists and is 1-200 chars
   - Check `currentDescription` is ≤2000 chars if provided
   - Return specific error codes for client handling

2. **Authentication Errors (401):**
   - Verify Supabase session exists
   - Return authentication required error

3. **OpenAI API Errors (500):**
   - Catch OpenAI client errors
   - Log error details server-side
   - Return generic user-friendly message
   - Include retry-able error code

4. **Timeout Errors (504):**
   - Use AbortController with 30s timeout
   - Cancel OpenAI request on timeout
   - Return timeout error with retry suggestion

### Response Processing

1. **Extract Generated Text:**
   - Get completion from OpenAI response
   - Trim whitespace
   - Validate length (max 2000 chars)

2. **Fallback Handling:**
   - If generation is too long, truncate to 2000 chars
   - If generation is empty, return error

3. **Return JSON:**
   - Wrap in `description` field
   - Set appropriate headers (Content-Type: application/json)

## Testing Endpoints

### Test Cases

1. **Happy Path - Name Only:**
```bash
curl -X POST http://localhost:3000/api/ai/generate-description \
  -H "Content-Type: application/json" \
  -d '{"projectName": "Smart Home Accessibility Study"}'
```

2. **Happy Path - Name + Description:**
```bash
curl -X POST http://localhost:3000/api/ai/generate-description \
  -H "Content-Type: application/json" \
  -d '{
    "projectName": "Smart Home Accessibility Study",
    "currentDescription": "A study about making smart homes accessible to elderly users"
  }'
```

3. **Error - Missing Name:**
```bash
curl -X POST http://localhost:3000/api/ai/generate-description \
  -H "Content-Type: application/json" \
  -d '{"currentDescription": "Some description"}'
```

4. **Error - Name Too Long:**
```bash
curl -X POST http://localhost:3000/api/ai/generate-description \
  -H "Content-Type: application/json" \
  -d '{"projectName": "'$(printf 'a%.0s' {1..201})'"}'
```

5. **Error - Unauthenticated:**
```bash
curl -X POST http://localhost:3000/api/ai/generate-description \
  -H "Content-Type: application/json" \
  -d '{"projectName": "Test Project"}' \
  --cookie ""
```

## Integration with Frontend

### API Call Implementation

**File:** `components/features/projects/ProjectForm.tsx`

```typescript
const handleEnhanceWithAI = async () => {
  setIsGenerating(true);

  try {
    const response = await fetch('/api/ai/generate-description', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectName: form.getValues('name'),
        currentDescription: form.getValues('description') || undefined,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate description');
    }

    const data = await response.json();
    form.setValue('description', data.description, { shouldValidate: true });

  } catch (error) {
    // Show alert dialog with error message
    setErrorMessage(error.message);
    setShowErrorDialog(true);

  } finally {
    setIsGenerating(false);
  }
};
```

### State Management

```typescript
const [isGenerating, setIsGenerating] = useState(false);
const [showErrorDialog, setShowErrorDialog] = useState(false);
const [errorMessage, setErrorMessage] = useState('');
```

### Error Dialog Component

```tsx
<AlertDialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Description Generation Failed</AlertDialogTitle>
      <AlertDialogDescription>{errorMessage}</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogAction onClick={() => setShowErrorDialog(false)}>
        Close
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```
