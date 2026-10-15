# Spec Tasks

Tasks for implementing the OpenAI API Key Settings feature as defined in @.agent-os/specs/2026-01-21-openai-key-settings/spec.md

## Tasks

- [x] 1. Database & Encryption Setup
  - [x] 1.1 Create Supabase migration for `user_settings` table with RLS policies
  - [x] 1.2 Create `lib/encryption.ts` with AES-256-GCM encrypt/decrypt/mask utilities
  - [x] 1.3 Add `API_KEY_ENCRYPTION_SECRET` to environment configuration
  - [x] 1.4 Verify migration runs successfully and RLS policies work

- [x] 2. API Key Management Endpoints
  - [x] 2.1 Create `app/api/user/settings/api-key/status/route.ts` for GET key status
  - [x] 2.2 Create `app/api/user/settings/api-key/route.ts` for POST (save) and DELETE (remove)
  - [x] 2.3 Add input validation (key format, length)
  - [x] 2.4 Verify endpoints work with Supabase auth

- [x] 3. AI Key Context Provider
  - [x] 3.1 Create `contexts/AIKeyContext.tsx` with `hasAIKey` and `isLoading` states
  - [x] 3.2 Create `useAIKey()` hook for consuming context
  - [x] 3.3 Integrate provider into project layout
  - [x] 3.4 Verify context updates after key save/remove operations

- [x] 4. Settings Subapp UI
  - [x] 4.1 Create `app/projects/[projectId]/settings/page.tsx` route
  - [x] 4.2 Create `components/features/settings/SettingsPage.tsx` with API key form
  - [x] 4.3 Add Settings item to `ProjectSidebar.tsx` below History with gear icon
  - [x] 4.4 Implement save/update/remove functionality with toast notifications
  - [x] 4.5 Verify full settings flow works end-to-end

- [x] 5. Disable AI Buttons When No Key
  - [x] 5.1 Update `ProjectForm.tsx` - disable AI Optimize button with tooltip
  - [x] 5.2 Update `PersonaFormDialog.tsx` - disable AI generation with tooltip
  - [x] 5.3 Add AI generation to `UserStoryFormDialog.tsx` with disabled state support
  - [x] 5.4 Update `UserJourneyMapForm.tsx` - disable AI optimization with tooltip
  - [x] 5.5 Update existing AI API routes to use user's decrypted key
  - [x] 5.6 Verify all AI buttons show correct disabled/enabled states
