# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-12-08-ai-project-description/spec.md

## Technical Requirements

### Frontend Components

#### 1. AI Button Component
- **Location**: Above the description textarea in `ProjectForm.tsx` (label area)
- **Icon**: Sparkles icon (match existing AI feature buttons from user stories/journey maps)
- **Text**: "AI Optimize"
- **Styling**: Consistent with existing AI feature buttons (check `user-story-form` and journey map components for reference)
- **States**:
  - Default: Enabled with sparkles icon
  - Loading: Disabled with "Generating with AI..." text
  - Error: Returns to default state after error dialog dismissed

#### 2. Form Integration
- **Component**: `components/features/projects/ProjectForm.tsx`
- **Field**: Description textarea (currently max 2000 characters, h-24 height)
- **Button Placement**: Add button in the label area above the textarea, similar to form field labels
- **State Management**: Use React Hook Form's `setValue` to update description field after AI generation

#### 3. Loading State
- **Button Behavior**: Disable button during API call
- **Visual Feedback**: Change button text to "Generating with AI..."
- **Duration**: Brief (API calls are fast based on existing AI features)
- **Form Interaction**: Users can still interact with other form fields during generation

#### 4. Error Handling UI
- **Component**: Use shadcn/ui `AlertDialog` component
- **Trigger**: Show dialog on API failure
- **Content**:
  - Title: "Description Generation Failed"
  - Description: Error message from API or generic fallback
  - Actions: "Close" button (primary) or "Retry" option
- **Data Preservation**: Never clear existing description text on error

### Backend API

#### 1. New API Endpoint
- **Path**: `/app/api/ai/generate-description/route.ts`
- **Method**: POST
- **Authentication**: Required (check for authenticated user session)
- **Rate Limiting**: Consider implementing (optional enhancement)

#### 2. Request Schema
```typescript
{
  projectName: string;      // Required, max 200 chars
  currentDescription?: string;  // Optional, max 2000 chars
}
```

#### 3. Response Schema
```typescript
{
  description: string;  // Generated description, max 2000 chars
}
```

#### 4. Error Response
```typescript
{
  error: string;  // Error message
  code?: string;  // Optional error code for client handling
}
```

### AI Integration

#### 1. OpenAI Configuration
- **Model**: `gpt-4o-mini` (consistent with user story generation in `ai-story-generator.ts`)
- **Temperature**: 0.7 (balanced creativity)
- **Max Tokens**: 800 (sufficient for 2-3 paragraphs, ~2000 chars)
- **Timeout**: 30 seconds (consistent with journey map generation)

#### 2. Prompt Engineering
- **System Prompt**: Define AI as HCI/UX project description assistant
- **Context Provided**:
  - Project name (always)
  - Current description (if exists)
  - Instruction to cover: goals, target users, scope, outcomes, HCI/UX methodology
  - Instruction to exclude: timeline, milestones, dates
  - Tone: Balanced (not casual, not overly professional)
  - Length: 2-3 paragraphs, proportional to input quality
- **Output Format**: Plain text (no JSON structure needed)

#### 3. Prompt Template
```
You are an assistant helping HCI and UX Design students write project descriptions.

Given a project name${currentDescription ? ' and existing description' : ''}, generate a clear, comprehensive project description that includes:
- Project goals and objectives
- Target users or stakeholders
- Scope boundaries (what's included)
- Expected outcomes
- Relevant HCI/UX methodology context (if applicable)

DO NOT include timeline, milestones, or specific dates.

Use a balanced, professional tone suitable for academic projects. Keep the description to 2-3 paragraphs.

Project Name: ${projectName}
${currentDescription ? `Current Description: ${currentDescription}` : ''}

Generate the enhanced project description:
```

### Performance Considerations

#### 1. API Response Time
- **Expected Duration**: 2-5 seconds based on existing AI features
- **User Feedback**: Button disabled state provides immediate feedback
- **Optimization**: Use streaming responses if generation takes longer than 5 seconds (future enhancement)

#### 2. Client-Side Validation
- **Pre-Flight Check**: Ensure project name is not empty before API call
- **Length Validation**: Trim and validate description length (max 2000 chars) before updating form
- **Debouncing**: Not required (button click-triggered, not auto-trigger)

### Integration Points

#### 1. Existing OpenAI Service
- **Reference Implementation**: `/lib/services/ai-story-generator.ts` for OpenAI client setup
- **API Key**: Use existing `OPENAI_API_KEY` environment variable
- **Error Handling**: Follow pattern from `/app/api/ai/generate-journey-map/route.ts` (abort controller, timeout)

#### 2. Form State Management
- **Library**: React Hook Form (already in use in `ProjectForm.tsx`)
- **Update Method**: `setValue('description', generatedText, { shouldValidate: true })`
- **Validation**: Trigger Zod validation after AI generation

#### 3. UI Components
- **Button**: Use existing shadcn/ui `Button` component
- **Icon**: Import sparkles icon (Lucide React or similar)
- **Alert Dialog**: Use existing shadcn/ui `AlertDialog` component
- **Loading State**: Use existing button disabled state patterns

### Testing Considerations

#### 1. Unit Tests
- Test prompt generation with different inputs (name only, name + description)
- Test description length validation
- Test error handling for API failures

#### 2. Integration Tests
- Test full flow: button click → API call → form update
- Test error dialog display on API failure
- Test regeneration (clicking button multiple times)

#### 3. Manual Testing
- Test with empty description field
- Test with existing description
- Test with very long project names (200 chars)
- Test with special characters in project name
- Test API timeout scenario
- Test OpenAI API rate limiting

### Security Considerations

#### 1. Input Validation
- Sanitize project name and description before sending to OpenAI
- Validate max lengths (name: 200 chars, description: 2000 chars)
- Strip dangerous characters or scripts

#### 2. Authentication
- Verify user is authenticated before allowing API access
- Use Supabase session validation

#### 3. Rate Limiting
- Consider implementing rate limiting to prevent abuse (future enhancement)
- Track AI usage per user if needed for billing/analytics

### Accessibility

#### 1. Button Accessibility
- Include `aria-label="Enhance project description with AI"`
- Ensure button has focus state
- Keyboard accessible (Tab navigation)

#### 2. Loading State Announcement
- Use `aria-live="polite"` region for "Generating with AI..." status
- Announce completion to screen readers

#### 3. Error Dialog
- Alert dialog should trap focus
- Keyboard navigation (Tab, Escape to close)
- Screen reader announces error message
