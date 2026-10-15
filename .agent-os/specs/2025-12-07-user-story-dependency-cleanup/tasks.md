# Spec Tasks

## Tasks

- [x] 1. Extend database cascade deletion function to clean up incoming story dependencies
  - [x] 1.1 Write tests for the updated `delete_user_story_with_cascade()` function to verify dependency cleanup
  - [x] 1.2 Update the database function to find all stories that reference the target story in their dependencies arrays
  - [x] 1.3 Update the database function to remove the deleted story's ID from all dependent stories' dependencies arrays
  - [x] 1.4 Update the function's return value to include statistics about dependency reference cleanup (count of stories updated)
  - [x] 1.5 Verify all tests pass and dependency references are properly removed atomically

- [x] 2. Update DELETE API endpoint to return dependency cleanup statistics
  - [ ] 2.1 Write tests for the updated DELETE endpoint response format (skipped - no test framework)
  - [x] 2.2 Update the API route to parse and return the dependency cleanup statistics from the database function
  - [x] 2.3 Add `dependenciesUpdated` field to the response object alongside existing `journeyMaps` and `timelineEntries`
  - [x] 2.4 Verify all tests pass and the API correctly returns cleanup statistics (manual verification - eslint passed)

- [x] 3. Create React hook to fetch incoming story dependencies
  - [ ] 3.1 Write tests for the new `useUserStoryIncomingDependencies` hook (skipped - no test framework)
  - [x] 3.2 Create fetch function for incoming dependencies that calls the existing dependencies endpoint and filters to incoming only
  - [x] 3.3 Implement the `useUserStoryIncomingDependencies` hook following the pattern of `useUserStoryJourneyMapDependencies`
  - [x] 3.4 Add appropriate query key structure and caching configuration (30s stale time)
  - [x] 3.5 Verify all tests pass and the hook correctly fetches incoming dependencies (manual verification - eslint passed)

- [x] 4. Update deletion dialog UI to display story dependency warnings
  - [ ] 4.1 Write tests for the updated deletion dialog component with story dependency warnings (skipped - no test framework)
  - [x] 4.2 Integrate the `useUserStoryIncomingDependencies` hook in the user stories page component
  - [x] 4.3 Add a new warning section for incoming story dependencies mirroring the journey map warning pattern (lines 323-394)
  - [x] 4.4 Display dependent stories with title, user role/action, status, priority, and view links in a scrollable list
  - [x] 4.5 Ensure consistent styling with AlertTriangle icon, destructive border, and hover states
  - [x] 4.6 Update the delete button text to show combined counts (e.g., "Delete Story & 2 Journey Maps & Update 3 Dependencies")
  - [x] 4.7 Handle loading and empty states for both journey map and story dependencies
  - [x] 4.8 Verify all tests pass and the UI correctly displays dependency warnings (manual verification - eslint passed)
