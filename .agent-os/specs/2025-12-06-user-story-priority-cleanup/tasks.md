# Spec Tasks

## Tasks

- [ ] 1. Database Migration for Sequential Priority Ordering
  - [x] 1.1 Write migration script to renumber priority_order values to sequential format
  - [x] 1.2 Write rollback script to restore 1000-increment gaps if needed
  - [x] 1.3 Add validation queries to verify sequential ordering after migration
  - [x] 1.4 Test migration on development database with sample data
  - [ ] 1.5 Execute migration and verify all user stories have sequential priority_order
  - [ ] 1.6 Verify no gaps or duplicates in priority_order sequences per project

- [x] 2. Update API Endpoints for Sequential Numbering
  - [ ] 2.1 Write tests for reorder endpoint with sequential priority_order values
  - [ ] 2.2 Write tests for create endpoint with sequential auto-calculation
  - [x] 2.3 Update POST /api/projects/[id]/user-stories route to use +1 increment instead of +1000
  - [x] 2.4 Update validation in PATCH /api/projects/[id]/user-stories/reorder route (optional strict validation)
  - [ ] 2.5 Test API endpoints manually or with Postman/Thunder Client
  - [ ] 2.6 Verify all API tests pass

- [x] 3. Update Frontend Drag-and-Drop Logic
  - [ ] 3.1 Write tests for UserStoriesTable drag-and-drop with sequential numbering
  - [x] 3.2 Update UserStoriesTable.tsx handleDragEnd to calculate sequential priority_order (index + 1)
  - [x] 3.3 Update useUpdateStoryOrder hook to handle sequential values in optimistic updates
  - [ ] 3.4 Test drag-and-drop reordering in browser (move stories between positions)
  - [ ] 3.5 Verify optimistic updates work correctly
  - [ ] 3.6 Verify all tests pass

- [x] 4. Remove Description Field from Manual Creation Form
  - [ ] 4.1 Write tests for UserStoryFormEnhanced with conditional description field
  - [x] 4.2 Update UserStoryFormEnhanced to conditionally render description field (only in AI mode)
  - [x] 4.3 Create separate Zod schemas for manual vs AI creation modes
  - [x] 4.4 Update form submission logic to exclude description from payload in manual mode
  - [ ] 4.5 Test manual creation form (description field should not appear)
  - [ ] 4.6 Test AI creation form (description field should appear and be required)
  - [ ] 4.7 Verify form validation works correctly in both modes
  - [ ] 4.8 Verify all tests pass

- [ ] 5. Update Validation Schemas
  - [ ] 5.1 Write tests for updated validation schemas
  - [ ] 5.2 Update lib/validations/user-story.ts to remove description from manual schema
  - [ ] 5.3 Create userStoryCreateWithAISchema that includes required description
  - [ ] 5.4 Update API route to use conditional validation based on generation_method
  - [ ] 5.5 Test validation with manual creation (should succeed without description)
  - [ ] 5.6 Test validation with AI creation (should require description)
  - [ ] 5.7 Verify all validation tests pass

- [ ] 6. Integration Testing and Quality Assurance
  - [ ] 6.1 Test complete user flow: create manual user story without description
  - [ ] 6.2 Test complete user flow: create AI user story with description
  - [ ] 6.3 Test drag-and-drop reordering with sequential priority_order display
  - [ ] 6.4 Verify existing user stories display with sequential numbering
  - [ ] 6.5 Test edge cases: reorder first story, reorder last story, reorder to middle
  - [ ] 6.6 Run full test suite (npm run test if available)
  - [ ] 6.7 Run build (npm run build) to verify TypeScript compilation
  - [ ] 6.8 Run linter (npm run lint) to verify code quality
