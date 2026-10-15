# Spec Tasks

## Tasks

- [x] 1. Update Type Definitions and Validation Schemas
  - [x] 1.1 Update `lib/types/database.ts` to remove `DependencyType` and `Dependency` interface, change `UserStory.dependencies` to `string[]`
  - [x] 1.2 Update `lib/validations/user-story.ts` to remove `dependencyTypeSchema` and `dependencySchema`, update to accept UUID string arrays
  - [x] 1.3 Update Database type definitions for user_stories Insert/Update operations
  - [x] 1.4 Run TypeScript compilation to verify type changes (`npx tsc --noEmit`)

- [x] 2. Create Database Migration
  - [x] 2.1 Create forward migration `supabase/migrations/20251208001_simplify_user_story_dependencies.sql` to transform dependencies from object array to string array
  - [x] 2.2 Create rollback migration `supabase/migrations/20251208002_rollback_simplify_dependencies.sql` to restore original structure
  - [x] 2.3 Add validation constraint to ensure dependencies is array of UUID strings
  - [x] 2.4 Test migration locally with sample data and verify transformation

- [x] 3. Update API Endpoint for Dependencies
  - [x] 3.1 Update `app/api/projects/[id]/user-stories/[storyId]/dependencies/route.ts` to remove type field from responses
  - [x] 3.2 Modify `DependencyResponse` interface to return simple `UserStory[]` arrays for outgoing/incoming
  - [x] 3.3 Simplify response building logic to work with string array dependencies
  - [x] 3.4 Update additional API routes (`app/api/projects/[id]/user-stories/route.ts` and `app/api/projects/[id]/user-stories/[storyId]/route.ts`)

- [x] 4. Update DependencySelector Component
  - [x] 4.1 Remove `DependencyType` imports and type-related constants (`dependencyTypeLabels`, `dependencyTypeDescriptions`)
  - [x] 4.2 Remove `selectedType` state and dependency type selector UI
  - [x] 4.3 Update `handleAddDependency` to push simple story ID string instead of object
  - [x] 4.4 Remove `handleUpdateDependencyType` function and type selector from dependency list
  - [x] 4.5 Update component props: `value: string[]`, `onChange: (dependencies: string[]) => void`
  - [x] 4.6 Component compiles correctly with new types

- [x] 5. Update DependencyList and DependencyBadge Components
  - [x] 5.1 Update `components/features/user-stories/DependencyList.tsx` to remove type imports, constants, and type-based rendering
  - [x] 5.2 Update props interfaces to remove `type` field, simplify to show only story information
  - [x] 5.3 Update `components/features/user-stories/DependencyBadge.tsx` to remove type colors, labels, and type-based display
  - [x] 5.4 Update component to work with `dependencies: string[]` prop type
  - [x] 5.5 Update `UserStoryDetail.tsx` to use new dependency types

- [x] 6. Update User Story Form Components
  - [x] 6.1 Update `components/features/user-stories/UserStoryForm.tsx` form schema for dependencies to `z.array(z.string().uuid())`
  - [x] 6.2 Update `components/features/user-stories/UserStoryFormEnhanced.tsx` similarly
  - [x] 6.3 Update form field handling to work with string array instead of object array
  - [x] 6.4 Update page components to handle string array dependencies

- [x] 7. Run Database Migration and Integration Testing
  - [x] 7.1 Database migration script created with backup recommendation
  - [x] 7.2 Run forward migration on database (user completed via Supabase SQL Editor)
  - [x] 7.3 Migration documentation provided in `supabase/APPLY_SIMPLIFY_DEPENDENCIES_MIGRATION.md`
  - [ ] 7.4 Test full user story creation, editing, and dependency management workflows (needs browser testing)
  - [ ] 7.5 Verify journey map functionality remains unaffected (needs browser testing)
  - [x] 7.6 Run build (`npm run build`) and verify no errors - ✅ Build successful

- [x] 8. Final Verification and Documentation
  - [x] 8.1 Run linting (`npm run lint`) - ✅ No dependency-related errors
  - [ ] 8.2 Test all dependency-related features in browser (create, edit, delete, view) - **PENDING USER TESTING**
  - [x] 8.3 Verify TypeScript compilation passes with no errors - ✅ Compiles successfully
  - [ ] 8.4 Verify journey maps display correctly and user story references work - **PENDING USER TESTING**
  - [x] 8.5 Update migration documentation and guidance files
  - [ ] 8.6 All tests pass and application works as expected - **PENDING USER TESTING**
