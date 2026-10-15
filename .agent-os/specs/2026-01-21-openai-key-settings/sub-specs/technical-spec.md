# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2026-01-21-openai-key-settings/spec.md

## Technical Requirements

### Settings Subapp

- Create new route: `app/projects/[projectId]/settings/page.tsx`
- Create settings component: `components/features/settings/SettingsPage.tsx`
- Add "Settings" item to `ProjectSidebar.tsx` below "History" with a gear icon (`Settings` from lucide-react)
- Settings page should display API key management UI

### API Key Input Form

- Use shadcn/ui Card component to contain the settings form
- Password-type input field for API key entry (hidden by default)
- Toggle button to show/hide key value while typing
- Save button to submit the key
- When key exists: show masked preview (e.g., "sk-...abc123" showing first 3 and last 6 characters)
- Update and Remove buttons for existing keys
- Loading states during save/update/remove operations
- Success/error toast notifications using existing toast system

### Encrypted Storage

- Use Node.js `crypto` module for AES-256-GCM encryption
- Store encryption key in environment variable: `API_KEY_ENCRYPTION_SECRET`
- Encrypt API key on server-side before storing in Supabase
- Decrypt API key on server-side when needed for AI API calls
- Never expose decrypted key to client-side

### AI Key Context Provider

- Create `contexts/AIKeyContext.tsx` to manage AI key availability state
- Provider should wrap the project layout
- Expose `hasAIKey: boolean` and `isLoading: boolean` states
- Fetch key status (exists/not exists) on mount via API call (do not fetch actual key)
- Refresh key status after save/update/remove operations

### AI Button Disabling

Affected components (both create and edit modes):

1. **ProjectForm.tsx** - "AI Optimize" button for description
2. **PersonaFormDialog.tsx** - AI generation toggle/button
3. **UserStoryFormDialog.tsx** - Add AI generation capability (currently missing)
4. **UserJourneyMapForm.tsx** - AI optimization button

Implementation pattern:
- Consume `useAIKey()` hook from AIKeyContext
- Conditionally apply `disabled` prop to AI buttons when `!hasAIKey`
- Wrap disabled buttons with Tooltip component showing: "Add your OpenAI API key in Settings to use AI features"
- Maintain existing button styling but add visual disabled state (opacity, cursor)

### AI API Route Updates

Update existing AI routes to use user's encrypted key:
- `app/api/ai/generate-description/route.ts`
- `app/api/ai/generate-persona/route.ts`
- `app/api/ai/generate-journey-map/route.ts`
- Create new route for user stories: `app/api/ai/generate-user-story/route.ts`

Each route should:
1. Get current user from Supabase auth
2. Fetch encrypted API key from user profile
3. Decrypt key server-side
4. Use decrypted key for OpenAI API call
5. Return 401 if no key configured

### UI/UX Specifications

- Settings page header: "Settings" with subtitle "Manage your account preferences"
- API Key section header: "OpenAI API Key" with description explaining its purpose
- Input placeholder: "sk-..."
- Disabled button tooltip: "Add your OpenAI API key in Settings to use AI features"
- Success toast: "API key saved successfully"
- Remove confirmation: Simple confirm dialog before deletion
- Visual indicator in sidebar or settings when key is configured (optional: green dot)

### Security Considerations

- API keys are only decrypted server-side during API calls
- Client only receives boolean status (key exists/not exists)
- Use secure HTTP-only approach for all key operations
- Sanitize and validate key format before storage (must start with "sk-")
