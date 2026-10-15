# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-12-06-user-story-priority-cleanup/spec.md

## Overview

This spec requires modifications to two API endpoints that handle user story creation and reordering to support sequential priority_order numbering (1, 2, 3...) instead of 1000-increment gaps.

## Endpoints

### PATCH /api/projects/[id]/user-stories/reorder

**Purpose:** Bulk update priority_order values for multiple user stories after drag-and-drop reordering

**File Location:** `app/api/projects/[id]/user-stories/reorder/route.ts`

#### Current Behavior

**Request Body:**
```typescript
{
  stories: [
    { id: "story-uuid-1", priority_order: 2000 },
    { id: "story-uuid-2", priority_order: 3000 },
    { id: "story-uuid-3", priority_order: 4000 }
  ]
}
```

**Current Calculation (Frontend - UserStoriesTable.tsx):**
```typescript
const updatedStories = newOrder.map((story, index) => ({
  id: story.id,
  priority_order: (index + 1) * 1000  // 1000-increment gaps
}));
```

#### Required Changes

**New Request Body:**
```typescript
{
  stories: [
    { id: "story-uuid-1", priority_order: 1 },
    { id: "story-uuid-2", priority_order: 2 },
    { id: "story-uuid-3", priority_order: 3 }
  ]
}
```

**New Calculation (Frontend - UserStoriesTable.tsx):**
```typescript
const updatedStories = newOrder.map((story, index) => ({
  id: story.id,
  priority_order: (index + 1)  // Sequential numbering
}));
```

#### Backend Validation Updates

**Current Validation:**
```typescript
// Validate priority_order values are positive integers
if (stories.some(s => s.priority_order <= 0 || !Number.isInteger(s.priority_order))) {
  return NextResponse.json(
    { error: 'Invalid priority_order values' },
    { status: 400 }
  );
}
```

**Enhanced Validation:**
```typescript
// Validate priority_order values are positive integers
if (stories.some(s => s.priority_order <= 0 || !Number.isInteger(s.priority_order))) {
  return NextResponse.json(
    { error: 'All priority_order values must be positive integers' },
    { status: 400 }
  );
}

// Optional: Validate sequential ordering (if strict validation desired)
const sortedOrders = stories.map(s => s.priority_order).sort((a, b) => a - b);
const isSequential = sortedOrders.every((order, index) => order === index + 1);
if (!isSequential) {
  return NextResponse.json(
    { error: 'Priority order values must be sequential (1, 2, 3...)' },
    { status: 400 }
  );
}
```

**Note:** Strict sequential validation is optional. If not enforced, the backend should accept any positive integers and trust the frontend to send correct sequential values.

#### Response Format

**Response:** (unchanged)
```typescript
{
  stories: [
    { id: "story-uuid-1", priority_order: 1, ... },
    { id: "story-uuid-2", priority_order: 2, ... },
    { id: "story-uuid-3", priority_order: 3, ... }
  ]
}
```

#### Error Handling

**Errors:** (mostly unchanged)
- **400 Bad Request:** Invalid request body, missing stories array, invalid priority_order values
- **401 Unauthorized:** User not authenticated
- **403 Forbidden:** User not a member of the project
- **404 Not Found:** Project not found, or story IDs don't belong to the project
- **500 Internal Server Error:** Database error during bulk update

**New Error Messages:**
- `"All priority_order values must be positive integers"` - when validation fails
- `"Priority order values must be sequential (1, 2, 3...)"` - if strict validation enabled

---

### POST /api/projects/[id]/user-stories

**Purpose:** Create a new user story with auto-calculated priority_order if not provided

**File Location:** `app/api/projects/[id]/user-stories/route.ts`

#### Current Behavior

**Auto-calculation Logic:**
```typescript
// If priority_order not provided, auto-calculate
let priorityOrder = body.priority_order;

if (!priorityOrder) {
  const { data: maxStory } = await supabase
    .from('user_stories')
    .select('priority_order')
    .eq('project_id', projectId)
    .order('priority_order', { ascending: false })
    .limit(1)
    .single();

  priorityOrder = maxStory ? maxStory.priority_order + 1000 : 1000;
}
```

#### Required Changes

**New Auto-calculation Logic:**
```typescript
// If priority_order not provided, auto-calculate
let priorityOrder = body.priority_order;

if (!priorityOrder) {
  const { data: maxStory } = await supabase
    .from('user_stories')
    .select('priority_order')
    .eq('project_id', projectId)
    .order('priority_order', { ascending: false })
    .limit(1)
    .single();

  priorityOrder = maxStory ? maxStory.priority_order + 1 : 1;  // Sequential increment
}
```

#### Request Body

**Request Body:** (unchanged structure, description now optional for manual mode)
```typescript
{
  title: string;
  user_role: string;
  action: string;
  benefit: string;
  description?: string;  // Optional for manual mode, required for AI mode
  acceptance_criteria?: string[];
  priority?: 'low' | 'medium' | 'high' | 'critical';
  priority_order?: number;  // Optional, auto-calculated if not provided
  status?: 'backlog' | 'in_progress' | 'done';
  story_points?: 1 | 2 | 3 | 5 | 8 | 13;
  generation_method: 'manual' | 'ai_generated';
  dependencies?: Array<{
    story_id: string;
    type: 'blocks' | 'requires' | 'relates_to';
  }>;
}
```

**Changes:**
- `description` field is now truly optional (was technically optional but always sent from forms)
- When `generation_method === 'manual'`, description will not be included in request body
- When `generation_method === 'ai_generated'`, description is required and will be included

#### Response Format

**Response:** (unchanged)
```typescript
{
  id: string;
  project_id: string;
  title: string;
  user_role: string;
  action: string;
  benefit: string;
  description?: string | null;  // May be null for manual entries
  acceptance_criteria?: string[] | null;
  priority?: 'low' | 'medium' | 'high' | 'critical' | null;
  priority_order: number;  // Will be sequential (1, 2, 3...)
  status?: 'backlog' | 'in_progress' | 'done' | null;
  story_points?: number | null;
  generation_method: 'manual' | 'ai_generated';
  dependencies: Array<{
    story_id: string;
    type: 'blocks' | 'requires' | 'relates_to';
  }>;
  created_at: string;
  updated_at: string;
  created_by: string;
}
```

#### Error Handling

**Errors:** (unchanged)
- **400 Bad Request:** Invalid request body, validation errors
- **401 Unauthorized:** User not authenticated
- **403 Forbidden:** User not a member of the project
- **404 Not Found:** Project not found, or referenced dependency stories don't exist
- **500 Internal Server Error:** Database error during creation

---

## Validation Schema Updates

**File Location:** `lib/validations/user-story.ts`

### Current Schemas

```typescript
// AI generation schema (requires description)
export const userStoryGenerateSchema = z.object({
  description: z.string().min(10).max(2000),
});

// Manual creation schema (description optional but always included)
export const userStoryCreateSchema = z.object({
  title: z.string().min(1).max(200),
  user_role: z.string().min(1).max(100),
  action: z.string().min(1).max(500),
  benefit: z.string().min(1).max(500),
  description: z.string().optional(),  // Optional but often sent
  // ... other fields
});
```

### Required Schema Changes

```typescript
// AI generation schema (unchanged - still requires description)
export const userStoryGenerateSchema = z.object({
  description: z.string().min(10).max(2000),
});

// Manual creation schema (description truly optional, will not be sent)
export const userStoryCreateSchema = z.object({
  title: z.string().min(1).max(200),
  user_role: z.string().min(1).max(100),
  action: z.string().min(1).max(500),
  benefit: z.string().min(1).max(500),
  // description field completely removed from manual schema
  acceptance_criteria: z.array(z.string().max(500)).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  priority_order: z.number().int().positive().optional(),
  status: z.enum(['backlog', 'in_progress', 'done']).optional(),
  story_points: z.enum([1, 2, 3, 5, 8, 13]).optional(),
  generation_method: z.enum(['manual', 'ai_generated']),
  dependencies: z.array(z.object({
    story_id: z.string().uuid(),
    type: z.enum(['blocks', 'requires', 'relates_to']),
  })).optional(),
});

// Separate schema for AI-assisted creation (includes description)
export const userStoryCreateWithAISchema = z.object({
  description: z.string().min(10).max(2000),  // Required for AI generation
  title: z.string().min(1).max(200),
  user_role: z.string().min(1).max(100),
  action: z.string().min(1).max(500),
  benefit: z.string().min(1).max(500),
  acceptance_criteria: z.array(z.string().max(500)).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  priority_order: z.number().int().positive().optional(),
  status: z.enum(['backlog', 'in_progress', 'done']).optional(),
  story_points: z.enum([1, 2, 3, 5, 8, 13]).optional(),
  generation_method: z.literal('ai_generated'),
  dependencies: z.array(z.object({
    story_id: z.string().uuid(),
    type: z.enum(['blocks', 'requires', 'relates_to']),
  })).optional(),
});
```

**Usage in API Route:**
```typescript
// In POST /api/projects/[id]/user-stories/route.ts
const body = await request.json();

let validatedData;
if (body.generation_method === 'ai_generated') {
  validatedData = userStoryCreateWithAISchema.parse(body);
} else {
  validatedData = userStoryCreateSchema.parse(body);
}
```

---

## Integration with Frontend

### React Hook Form Schema Updates

**File Location:** `components/features/user-stories/UserStoryFormEnhanced.tsx`

**Current Form Schema:**
```typescript
const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  user_role: z.string().min(1, "User role is required"),
  action: z.string().min(1, "Action is required"),
  benefit: z.string().min(1, "Benefit is required"),
  description: z.string().optional(),  // Always included in form
  // ... other fields
});
```

**New Form Schema (Conditional):**
```typescript
// Base schema for manual mode (no description)
const manualFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  user_role: z.string().min(1, "User role is required"),
  action: z.string().min(1, "Action is required"),
  benefit: z.string().min(1, "Benefit is required"),
  acceptance_criteria: z.array(z.string()).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  status: z.enum(['backlog', 'in_progress', 'done']).optional(),
  story_points: z.number().optional(),
  dependencies: z.array(z.object({
    story_id: z.string(),
    type: z.enum(['blocks', 'requires', 'relates_to']),
  })).optional(),
});

// Schema for AI mode (includes description)
const aiFormSchema = manualFormSchema.extend({
  description: z.string().min(10, "Description is required for AI generation"),
});

// Use conditional schema based on generation mode
const formSchema = generationMode === 'ai' ? aiFormSchema : manualFormSchema;
```

### Form Submission Logic

**Current Submission:**
```typescript
const onSubmit = async (data: FormData) => {
  await createUserStory.mutateAsync({
    ...data,
    generation_method: generationMode,
  });
};
```

**New Submission (Conditional Description):**
```typescript
const onSubmit = async (data: FormData) => {
  const payload = {
    ...data,
    generation_method: generationMode,
  };

  // Remove description from payload if in manual mode
  if (generationMode === 'manual') {
    delete payload.description;
  }

  await createUserStory.mutateAsync(payload);
};
```

---

## Testing Considerations

### API Endpoint Tests

**Test Cases for PATCH /api/projects/[id]/user-stories/reorder:**
1. ✅ Reorder stories with sequential priority_order (1, 2, 3...)
2. ✅ Verify all stories in the request are updated correctly
3. ✅ Verify stories not in the request remain unchanged
4. ✅ Test with single story reorder (edge case)
5. ✅ Test with maximum allowed stories (100)
6. ✅ Validate error handling for non-sequential values (if strict validation enabled)
7. ✅ Validate error handling for invalid story IDs
8. ✅ Validate authorization (user must be project member)

**Test Cases for POST /api/projects/[id]/user-stories:**
1. ✅ Create story without priority_order → auto-assigns sequential value
2. ✅ Create story as first in project → assigns priority_order = 1
3. ✅ Create story after existing stories → assigns max + 1
4. ✅ Create manual story without description → succeeds
5. ✅ Create AI story with description → succeeds
6. ✅ Create AI story without description → fails validation
7. ✅ Validate auto-increment uses sequential numbering (not 1000 gaps)

### Frontend Component Tests

**Test Cases for UserStoryFormEnhanced:**
1. ✅ Manual mode does not render description field
2. ✅ AI mode renders description field
3. ✅ Switching from AI to manual mode clears description from form
4. ✅ Manual mode submission does not include description in payload
5. ✅ AI mode submission includes description in payload
6. ✅ Form validation requires description in AI mode
7. ✅ Form validation does not require description in manual mode

**Test Cases for UserStoriesTable:**
1. ✅ Drag-and-drop calculates sequential priority_order (1, 2, 3...)
2. ✅ Moving story from position 5 to position 2 renumbers all affected stories
3. ✅ Table displays stories in correct order after reorder
4. ✅ Optimistic update shows new order immediately
5. ✅ Reorder API call sends correct sequential values

---

## Summary of Changes

### API Route Changes
- **File:** `app/api/projects/[id]/user-stories/reorder/route.ts`
  - No structural changes, only updated values from frontend
  - Optional: Add strict sequential validation

- **File:** `app/api/projects/[id]/user-stories/route.ts`
  - Change auto-calculation: `maxPriorityOrder + 1` instead of `+ 1000`
  - Accept optional description field (may be omitted for manual entries)

### Validation Changes
- **File:** `lib/validations/user-story.ts`
  - Remove description from `userStoryCreateSchema`
  - Create separate `userStoryCreateWithAISchema` that includes description
  - Use conditional validation in API route based on `generation_method`

### Frontend Changes
- **File:** `components/features/user-stories/UserStoryFormEnhanced.tsx`
  - Conditionally render description field based on `generationMode`
  - Use conditional Zod schema based on mode
  - Remove description from payload when in manual mode

- **File:** `components/features/user-stories/UserStoriesTable.tsx`
  - Change calculation: `(index + 1)` instead of `(index + 1) * 1000`
