# User Story Cascade Deletion - Testing Guide

This guide provides step-by-step instructions for testing the cascade deletion feature.

## Prerequisites

Before testing, ensure:
- ✅ Migration applied to Supabase (Task 1 complete)
- ✅ Backend API endpoints deployed (Tasks 2-3 complete)
- ✅ Frontend changes deployed (Tasks 4-6 complete)
- ✅ Development server running: `npm run dev`

## Test Environment Setup

### 1. Prepare Test Data

You'll need:
- **Project**: An existing project to test with
- **User Stories**: At least 3 user stories
  - 1 story with NO journey map references
  - 1 story referenced in 1 journey map
  - 1 story referenced in multiple (2+) journey maps
- **Journey Maps**: At least 2-3 journey maps for testing

---

## Test Case 1: Delete User Story WITHOUT Dependencies

**Purpose**: Verify normal deletion flow still works for stories with no journey map references.

### Steps:

1. **Navigate to User Stories**
   - Go to your project: `/projects/{project-id}/user-stories`
   - Identify a user story that is NOT used in any journey maps

2. **Initiate Deletion**
   - Click the delete button/action for the story
   - Observe the delete confirmation dialog

### ✅ Expected Results:

- [ ] Delete dialog appears with title "Delete User Story"
- [ ] Dialog shows: "Are you sure you want to delete {story-title}? This action cannot be undone."
- [ ] **NO warning section** appears (no cascade deletion warning)
- [ ] Button text shows: "Delete" (NOT "Delete Story & X Journey Maps")
- [ ] Brief "Checking dependencies..." loading state may appear

3. **Confirm Deletion**
   - Click "Delete" button
   - Wait for deletion to complete

### ✅ Expected Results:

- [ ] Success toast: "User story deleted successfully"
- [ ] Story is removed from the table
- [ ] Page updates to reflect the deletion

---

## Test Case 2: Delete User Story WITH 1 Journey Map Dependency

**Purpose**: Verify cascade deletion warning appears and deletion works correctly.

### Steps:

1. **Create Test Setup** (if needed)
   - Create a user story
   - Create 1 journey map that references this story in its timeline

2. **Navigate and Initiate Deletion**
   - Go to User Stories page
   - Click delete on the story that's referenced in 1 journey map

### ✅ Expected Results - Dialog Display:

- [ ] Delete dialog appears
- [ ] **Loading state** shows: "Checking dependencies..."
- [ ] After loading (~1-2 seconds), **warning section appears** with:
  - [ ] 🔺 AlertTriangle icon (orange/red)
  - [ ] Header: "Cascade Deletion Warning"
  - [ ] Text: "Deleting this user story will also permanently delete the following 1 journey map that references it:"
  - [ ] Journey map card showing:
    - [ ] Journey map title
    - [ ] Creation date (formatted as locale date)
    - [ ] "View" link with ExternalLink icon
- [ ] Button text: **"Delete Story & 1 Journey Map"**

3. **Test Navigation Link**
   - Click the "View" link next to the journey map

### ✅ Expected Results:

- [ ] Journey map page opens **in a new tab**
- [ ] Correct journey map is displayed
- [ ] Delete dialog remains open in original tab

4. **Confirm Cascade Deletion**
   - Close the journey map tab
   - Return to delete dialog
   - Click "Delete Story & 1 Journey Map" button

### ✅ Expected Results:

- [ ] Button shows "Deleting..." during operation
- [ ] Success toast appears
- [ ] User story is removed from the table
- [ ] Dialog closes

5. **Verify Journey Map Was Deleted**
   - Navigate to Journey Maps page: `/projects/{project-id}/user-journey-maps`

### ✅ Expected Results:

- [ ] The referenced journey map is **no longer in the list**
- [ ] Other journey maps (if any) are still present

---

## Test Case 3: Delete User Story WITH Multiple Journey Map Dependencies

**Purpose**: Verify the UI handles multiple dependencies correctly.

### Steps:

1. **Create Test Setup** (if needed)
   - Create a user story
   - Create 2-3 journey maps that all reference this story

2. **Initiate Deletion**
   - Navigate to User Stories page
   - Click delete on the story with multiple journey map references

### ✅ Expected Results - Dialog Display:

- [ ] Warning section appears after loading
- [ ] Text shows: "...the following **2** journey **maps** that reference it:" (or 3, etc.)
  - [ ] Correct pluralization ("map" vs "maps")
- [ ] **All journey maps** are listed in the scrollable area
- [ ] Each journey map card shows:
  - [ ] Title
  - [ ] Creation date
  - [ ] "View" link
- [ ] Button text: **"Delete Story & {count} Journey Maps"** (e.g., "Delete Story & 3 Journey Maps")

3. **Test Scrollable List**
   - If more than ~4 journey maps, verify scrolling

### ✅ Expected Results:

- [ ] List has max height of 300px
- [ ] Scrollbar appears if content exceeds 300px
- [ ] All journey maps are accessible via scroll

4. **Test Multiple View Links**
   - Click "View" on different journey maps
   - Verify each opens the correct journey map in a new tab

5. **Confirm Cascade Deletion**
   - Click "Delete Story & {count} Journey Maps"

### ✅ Expected Results:

- [ ] User story deleted
- [ ] **All referenced journey maps deleted**
- [ ] Other journey maps (not referencing this story) remain

---

## Test Case 4: Navigation and UX Verification

**Purpose**: Verify responsive design, accessibility, and UX polish.

### Tests:

1. **Responsive Design**
   - Resize browser window
   - Test on mobile view (Chrome DevTools)

### ✅ Expected Results:

- [ ] Dialog remains readable on narrow screens
- [ ] Journey map cards stack properly
- [ ] Buttons remain accessible
- [ ] Text doesn't overflow

2. **Hover Effects**
   - Hover over journey map cards
   - Hover over "View" links

### ✅ Expected Results:

- [ ] Cards show hover state (background color change)
- [ ] "View" links show underline on hover
- [ ] Cursor changes to pointer

3. **Loading States**
   - Watch the dependency check loading state

### ✅ Expected Results:

- [ ] "Checking dependencies..." appears immediately
- [ ] Warning section appears after data loads
- [ ] No flickering or layout shift

4. **Button States**
   - Test cancel button
   - Test delete button when loading

### ✅ Expected Results:

- [ ] Cancel button closes dialog without deletion
- [ ] Delete button is disabled during dependency loading
- [ ] Delete button shows "Deleting..." during deletion

---

## Test Case 5: Error Scenarios

**Purpose**: Verify error handling works correctly.

### Test 5.1: Network Failure During Dependency Check

**Manual Test** (requires browser DevTools):
1. Open delete dialog
2. Immediately open DevTools → Network tab → Throttle to "Offline"
3. Observe behavior

### ✅ Expected Results:

- [ ] Error is handled gracefully (may show error toast or fallback to no dependencies)
- [ ] Dialog remains functional
- [ ] User can still cancel

### Test 5.2: Unauthorized Access

**Database Test**:
1. In Supabase SQL Editor, check RLS policies prevent unauthorized deletion

```sql
-- This should fail if user doesn't have access
SELECT delete_user_story_with_cascade(
  'story-uuid'::UUID,
  'different-project-uuid'::UUID
);
```

### ✅ Expected Results:

- [ ] Function raises exception
- [ ] API returns 404 or 403 error

---

## Test Case 6: Database Integrity Verification

**Purpose**: Ensure no orphaned records remain after cascade deletion.

### After performing a cascade deletion:

1. **Check Timeline Entries**

```sql
-- Should return 0 rows
SELECT * FROM user_journey_map_timeline
WHERE user_story_id = 'deleted-story-uuid';
```

### ✅ Expected Results:

- [ ] **0 rows** returned

2. **Check Journey Maps**

```sql
-- Should return 0 rows for deleted journey maps
SELECT * FROM user_journey_maps
WHERE id IN ('deleted-journey-map-uuid-1', 'deleted-journey-map-uuid-2');
```

### ✅ Expected Results:

- [ ] **0 rows** returned for deleted journey maps
- [ ] Other journey maps still exist

3. **Check User Story**

```sql
-- Should return 0 rows
SELECT * FROM user_stories
WHERE id = 'deleted-story-uuid';
```

### ✅ Expected Results:

- [ ] **0 rows** returned

---

## Test Case 7: Edge Cases

### Test 7.1: Rapid Dialog Open/Close

1. Open delete dialog
2. Immediately close it
3. Reopen delete dialog
4. Verify no stale data

### ✅ Expected Results:

- [ ] Fresh dependency check runs each time
- [ ] No stale data from previous open

### Test 7.2: Story Used Multiple Times in Same Journey Map

**Setup**: Add the same user story multiple times to one journey map's timeline

1. Delete the user story

### ✅ Expected Results:

- [ ] Journey map appears **only once** in the list (no duplicates)
- [ ] Deletion still works correctly

---

## Test Case 8: Performance & Build Verification

### Build Check

```bash
npm run build
```

### ✅ Expected Results:

- [ ] Build completes successfully
- [ ] No TypeScript errors in cascade deletion files
- [ ] No ESLint warnings

### Lint Check

```bash
npx eslint app/api/projects/[id]/user-stories/ app/projects/[projectId]/user-stories/ lib/hooks/use-user-stories.ts
```

### ✅ Expected Results:

- [ ] All files pass linting
- [ ] No warnings or errors

---

## Summary Checklist

After completing all tests:

- [ ] Test Case 1: Delete without dependencies ✓
- [ ] Test Case 2: Delete with 1 dependency ✓
- [ ] Test Case 3: Delete with multiple dependencies ✓
- [ ] Test Case 4: Navigation and UX ✓
- [ ] Test Case 5: Error scenarios ✓
- [ ] Test Case 6: Database integrity ✓
- [ ] Test Case 7: Edge cases ✓
- [ ] Test Case 8: Build verification ✓

---

## Reporting Issues

If you encounter any issues during testing:

1. **Document the issue**:
   - What you did (steps)
   - What you expected
   - What actually happened
   - Screenshot (if applicable)

2. **Check browser console** for errors

3. **Check Supabase logs**:
   - Go to Supabase Dashboard → Logs
   - Look for errors related to the cascade deletion function

4. **Verify migration** was applied:
   ```sql
   SELECT proname FROM pg_proc WHERE proname = 'delete_user_story_with_cascade';
   ```

---

## Next Steps After Testing

Once all tests pass:
1. ✅ Mark Task 7 complete in tasks.md
2. 📝 Document any findings or improvements
3. 🎉 Feature is ready for production!
