-- Test Script: User Story Dependency Cleanup on Deletion
-- Created: 2025-12-07
-- Description: Test the updated delete_user_story_with_cascade function with dependency cleanup
-- IMPORTANT: This is a test file - DO NOT apply to production!
-- Run this in a transaction and ROLLBACK to avoid affecting real data

-- ============================================================================
-- TEST SETUP - Create temporary test data
-- ============================================================================

BEGIN;

-- Clean up any existing test data first
DO $$
DECLARE
  v_test_project_id UUID;
  v_test_user_id UUID;
BEGIN
  -- Find or create test project and user
  -- Note: In production, replace with actual test IDs

  -- We'll use this section to create isolated test data
  RAISE NOTICE 'Test setup complete - ready for dependency cleanup tests';
END $$;

-- ============================================================================
-- TEST CASE 1: Story with incoming dependencies (NO journey maps)
-- ============================================================================
-- Purpose: Verify that when deleting a story, all references to it are
--          removed from other stories' dependencies arrays

DO $$
DECLARE
  v_project_id UUID;
  v_story_a_id UUID;  -- Story that will be deleted
  v_story_b_id UUID;  -- Story that depends on Story A
  v_story_c_id UUID;  -- Another story that depends on Story A
  v_result JSON;
  v_story_b_deps JSONB;
  v_story_c_deps JSONB;
BEGIN
  RAISE NOTICE '==============================================================================';
  RAISE NOTICE 'TEST CASE 1: Story with incoming dependencies (no journey maps)';
  RAISE NOTICE '==============================================================================';

  -- Setup: Find a test project or use existing
  SELECT id INTO v_project_id FROM projects LIMIT 1;

  IF v_project_id IS NULL THEN
    RAISE EXCEPTION 'No project found for testing. Please create a test project first.';
  END IF;

  -- Create test Story A (the one that will be deleted)
  INSERT INTO user_stories (
    project_id, title, user_role, user_action, priority, status, dependencies
  ) VALUES (
    v_project_id,
    'TEST: Story A - To Be Deleted',
    'Test User',
    'perform action A',
    'high',
    'draft',
    '[]'::jsonb
  ) RETURNING id INTO v_story_a_id;

  -- Create test Story B that depends on Story A
  INSERT INTO user_stories (
    project_id, title, user_role, user_action, priority, status, dependencies
  ) VALUES (
    v_project_id,
    'TEST: Story B - Depends on A (blocks)',
    'Test User',
    'perform action B',
    'medium',
    'draft',
    jsonb_build_array(
      jsonb_build_object('story_id', v_story_a_id, 'type', 'blocks')
    )
  ) RETURNING id INTO v_story_b_id;

  -- Create test Story C that also depends on Story A
  INSERT INTO user_stories (
    project_id, title, user_role, user_action, priority, status, dependencies
  ) VALUES (
    v_project_id,
    'TEST: Story C - Depends on A (requires)',
    'Test User',
    'perform action C',
    'low',
    'in_progress',
    jsonb_build_array(
      jsonb_build_object('story_id', v_story_a_id, 'type', 'requires')
    )
  ) RETURNING id INTO v_story_c_id;

  RAISE NOTICE 'Setup complete:';
  RAISE NOTICE '  Story A ID: %', v_story_a_id;
  RAISE NOTICE '  Story B ID: % (depends on A)', v_story_b_id;
  RAISE NOTICE '  Story C ID: % (depends on A)', v_story_c_id;

  -- Verify setup: Check that Story B and C have dependencies on Story A
  SELECT dependencies INTO v_story_b_deps FROM user_stories WHERE id = v_story_b_id;
  SELECT dependencies INTO v_story_c_deps FROM user_stories WHERE id = v_story_c_id;

  RAISE NOTICE 'Story B dependencies before deletion: %', v_story_b_deps;
  RAISE NOTICE 'Story C dependencies before deletion: %', v_story_c_deps;

  -- Execute: Delete Story A (should clean up dependencies in B and C)
  SELECT delete_user_story_with_cascade(v_story_a_id, v_project_id) INTO v_result;

  RAISE NOTICE 'Deletion result: %', v_result;

  -- Verify: Story A should be deleted
  IF EXISTS (SELECT 1 FROM user_stories WHERE id = v_story_a_id) THEN
    RAISE EXCEPTION 'FAILED: Story A still exists after deletion';
  ELSE
    RAISE NOTICE '✓ PASSED: Story A was deleted';
  END IF;

  -- Verify: Story B's dependencies should no longer contain Story A
  SELECT dependencies INTO v_story_b_deps FROM user_stories WHERE id = v_story_b_id;

  IF v_story_b_deps::text LIKE '%' || v_story_a_id::text || '%' THEN
    RAISE EXCEPTION 'FAILED: Story B still has reference to Story A in dependencies: %', v_story_b_deps;
  ELSE
    RAISE NOTICE '✓ PASSED: Story B dependencies cleaned up: %', v_story_b_deps;
  END IF;

  -- Verify: Story C's dependencies should no longer contain Story A
  SELECT dependencies INTO v_story_c_deps FROM user_stories WHERE id = v_story_c_id;

  IF v_story_c_deps::text LIKE '%' || v_story_a_id::text || '%' THEN
    RAISE EXCEPTION 'FAILED: Story C still has reference to Story A in dependencies: %', v_story_c_deps;
  ELSE
    RAISE NOTICE '✓ PASSED: Story C dependencies cleaned up: %', v_story_c_deps;
  END IF;

  -- Verify: Result should include dependenciesUpdated count
  IF v_result->>'success' = 'true' AND
     (v_result->'updated'->>'dependenciesUpdated')::integer = 2 THEN
    RAISE NOTICE '✓ PASSED: Function returned correct dependenciesUpdated count: %',
                 v_result->'updated'->>'dependenciesUpdated';
  ELSE
    RAISE EXCEPTION 'FAILED: Expected dependenciesUpdated=2, got: %', v_result;
  END IF;

  RAISE NOTICE 'TEST CASE 1: ALL CHECKS PASSED ✓';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- TEST CASE 2: Story with NO incoming dependencies (should still work)
-- ============================================================================

DO $$
DECLARE
  v_project_id UUID;
  v_story_id UUID;
  v_result JSON;
BEGIN
  RAISE NOTICE '==============================================================================';
  RAISE NOTICE 'TEST CASE 2: Story with NO incoming dependencies';
  RAISE NOTICE '==============================================================================';

  SELECT id INTO v_project_id FROM projects LIMIT 1;

  -- Create a standalone story with no dependencies
  INSERT INTO user_stories (
    project_id, title, user_role, user_action, priority, status, dependencies
  ) VALUES (
    v_project_id,
    'TEST: Standalone Story - No Dependencies',
    'Test User',
    'perform standalone action',
    'medium',
    'draft',
    '[]'::jsonb
  ) RETURNING id INTO v_story_id;

  RAISE NOTICE 'Setup complete: Standalone Story ID: %', v_story_id;

  -- Execute: Delete the standalone story
  SELECT delete_user_story_with_cascade(v_story_id, v_project_id) INTO v_result;

  RAISE NOTICE 'Deletion result: %', v_result;

  -- Verify: Story should be deleted
  IF EXISTS (SELECT 1 FROM user_stories WHERE id = v_story_id) THEN
    RAISE EXCEPTION 'FAILED: Story still exists after deletion';
  ELSE
    RAISE NOTICE '✓ PASSED: Story was deleted';
  END IF;

  -- Verify: Result should show 0 dependencies updated
  IF v_result->>'success' = 'true' AND
     (v_result->'updated'->>'dependenciesUpdated')::integer = 0 THEN
    RAISE NOTICE '✓ PASSED: Function returned dependenciesUpdated=0: %', v_result;
  ELSE
    RAISE EXCEPTION 'FAILED: Expected dependenciesUpdated=0, got: %', v_result;
  END IF;

  RAISE NOTICE 'TEST CASE 2: ALL CHECKS PASSED ✓';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- TEST CASE 3: Story with both journey maps AND incoming dependencies
-- ============================================================================

DO $$
DECLARE
  v_project_id UUID;
  v_persona_id UUID;
  v_story_a_id UUID;  -- Story to be deleted (has journey map references)
  v_story_b_id UUID;  -- Story that depends on A
  v_journey_map_id UUID;
  v_result JSON;
  v_story_b_deps JSONB;
BEGIN
  RAISE NOTICE '==============================================================================';
  RAISE NOTICE 'TEST CASE 3: Story with BOTH journey maps AND incoming dependencies';
  RAISE NOTICE '==============================================================================';

  SELECT id INTO v_project_id FROM projects LIMIT 1;

  -- Get or create a test persona
  SELECT id INTO v_persona_id FROM personas WHERE project_id = v_project_id LIMIT 1;

  IF v_persona_id IS NULL THEN
    INSERT INTO personas (project_id, name, age_range, goals, bio)
    VALUES (v_project_id, 'Test Persona', '25-35', '{}', 'Test persona for dependency cleanup')
    RETURNING id INTO v_persona_id;
  END IF;

  -- Create Story A (will have journey map reference AND be referenced by Story B)
  INSERT INTO user_stories (
    project_id, title, user_role, user_action, priority, status, dependencies
  ) VALUES (
    v_project_id,
    'TEST: Story A - Has Journey Map and Incoming Dependency',
    'Test User',
    'perform complex action',
    'high',
    'draft',
    '[]'::jsonb
  ) RETURNING id INTO v_story_a_id;

  -- Create Story B that depends on Story A
  INSERT INTO user_stories (
    project_id, title, user_role, user_action, priority, status, dependencies
  ) VALUES (
    v_project_id,
    'TEST: Story B - Depends on A',
    'Test User',
    'follow up action',
    'medium',
    'draft',
    jsonb_build_array(
      jsonb_build_object('story_id', v_story_a_id, 'type', 'relates_to')
    )
  ) RETURNING id INTO v_story_b_id;

  -- Create a journey map that references Story A
  INSERT INTO user_journey_maps (
    project_id, persona_id, title, description, scenario
  ) VALUES (
    v_project_id,
    v_persona_id,
    'TEST: Journey Map referencing Story A',
    'Test journey map',
    'Test scenario'
  ) RETURNING id INTO v_journey_map_id;

  -- Create timeline entry linking the journey map to Story A
  INSERT INTO user_journey_map_timeline (
    journey_map_id, user_story_id, phase, sequence_order
  ) VALUES (
    v_journey_map_id, v_story_a_id, 'action', 1
  );

  RAISE NOTICE 'Setup complete:';
  RAISE NOTICE '  Story A ID: %', v_story_a_id;
  RAISE NOTICE '  Story B ID: % (depends on A)', v_story_b_id;
  RAISE NOTICE '  Journey Map ID: % (references A)', v_journey_map_id;

  -- Execute: Delete Story A (should clean up journey map AND Story B dependency)
  SELECT delete_user_story_with_cascade(v_story_a_id, v_project_id) INTO v_result;

  RAISE NOTICE 'Deletion result: %', v_result;

  -- Verify: Story A should be deleted
  IF NOT EXISTS (SELECT 1 FROM user_stories WHERE id = v_story_a_id) THEN
    RAISE NOTICE '✓ PASSED: Story A was deleted';
  ELSE
    RAISE EXCEPTION 'FAILED: Story A still exists';
  END IF;

  -- Verify: Journey map should be deleted
  IF NOT EXISTS (SELECT 1 FROM user_journey_maps WHERE id = v_journey_map_id) THEN
    RAISE NOTICE '✓ PASSED: Journey map was deleted';
  ELSE
    RAISE EXCEPTION 'FAILED: Journey map still exists';
  END IF;

  -- Verify: Story B's dependencies should be cleaned up
  SELECT dependencies INTO v_story_b_deps FROM user_stories WHERE id = v_story_b_id;

  IF v_story_b_deps::text NOT LIKE '%' || v_story_a_id::text || '%' THEN
    RAISE NOTICE '✓ PASSED: Story B dependencies cleaned up: %', v_story_b_deps;
  ELSE
    RAISE EXCEPTION 'FAILED: Story B still references Story A: %', v_story_b_deps;
  END IF;

  -- Verify: Result should show both journey maps deleted AND dependencies updated
  IF v_result->>'success' = 'true' AND
     (v_result->'deleted'->>'journeyMaps')::integer >= 1 AND
     (v_result->'updated'->>'dependenciesUpdated')::integer = 1 THEN
    RAISE NOTICE '✓ PASSED: Function returned correct counts:';
    RAISE NOTICE '  journeyMaps: %', v_result->'deleted'->>'journeyMaps';
    RAISE NOTICE '  dependenciesUpdated: %', v_result->'updated'->>'dependenciesUpdated';
  ELSE
    RAISE EXCEPTION 'FAILED: Unexpected result counts: %', v_result;
  END IF;

  RAISE NOTICE 'TEST CASE 3: ALL CHECKS PASSED ✓';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- TEST CASE 4: Edge case - Story with multiple dependencies on same story
-- ============================================================================

DO $$
DECLARE
  v_project_id UUID;
  v_story_a_id UUID;
  v_story_b_id UUID;  -- Has multiple dependency entries (edge case - shouldn't happen but test it)
  v_result JSON;
  v_story_b_deps JSONB;
BEGIN
  RAISE NOTICE '==============================================================================';
  RAISE NOTICE 'TEST CASE 4: Edge case - Story B has duplicate dependencies on Story A';
  RAISE NOTICE '==============================================================================';

  SELECT id INTO v_project_id FROM projects LIMIT 1;

  -- Create Story A
  INSERT INTO user_stories (
    project_id, title, user_role, user_action, priority, status, dependencies
  ) VALUES (
    v_project_id,
    'TEST: Story A - Referenced multiple times',
    'Test User',
    'base action',
    'high',
    'draft',
    '[]'::jsonb
  ) RETURNING id INTO v_story_a_id;

  -- Create Story B with duplicate dependencies (edge case)
  INSERT INTO user_stories (
    project_id, title, user_role, user_action, priority, status, dependencies
  ) VALUES (
    v_project_id,
    'TEST: Story B - Has duplicate deps on A',
    'Test User',
    'dependent action',
    'medium',
    'draft',
    jsonb_build_array(
      jsonb_build_object('story_id', v_story_a_id, 'type', 'blocks'),
      jsonb_build_object('story_id', v_story_a_id, 'type', 'requires')
    )
  ) RETURNING id INTO v_story_b_id;

  RAISE NOTICE 'Setup complete:';
  RAISE NOTICE '  Story A ID: %', v_story_a_id;
  RAISE NOTICE '  Story B ID: % (has duplicate deps on A)', v_story_b_id;

  -- Check initial dependencies
  SELECT dependencies INTO v_story_b_deps FROM user_stories WHERE id = v_story_b_id;
  RAISE NOTICE '  Story B dependencies before: %', v_story_b_deps;

  -- Execute: Delete Story A
  SELECT delete_user_story_with_cascade(v_story_a_id, v_project_id) INTO v_result;

  RAISE NOTICE 'Deletion result: %', v_result;

  -- Verify: Story B should have ALL references to Story A removed
  SELECT dependencies INTO v_story_b_deps FROM user_stories WHERE id = v_story_b_id;

  IF v_story_b_deps::text NOT LIKE '%' || v_story_a_id::text || '%' THEN
    RAISE NOTICE '✓ PASSED: All duplicate references removed: %', v_story_b_deps;
  ELSE
    RAISE EXCEPTION 'FAILED: Story B still has reference to Story A: %', v_story_b_deps;
  END IF;

  RAISE NOTICE 'TEST CASE 4: ALL CHECKS PASSED ✓';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- TEST CASE 5: Error handling - non-existent story
-- ============================================================================

DO $$
DECLARE
  v_project_id UUID;
  v_fake_story_id UUID := 'ffffffff-ffff-ffff-ffff-ffffffffffff'::UUID;
  v_result JSON;
  v_error_occurred BOOLEAN := FALSE;
BEGIN
  RAISE NOTICE '==============================================================================';
  RAISE NOTICE 'TEST CASE 5: Error handling - non-existent story';
  RAISE NOTICE '==============================================================================';

  SELECT id INTO v_project_id FROM projects LIMIT 1;

  -- Attempt to delete non-existent story (should raise exception)
  BEGIN
    SELECT delete_user_story_with_cascade(v_fake_story_id, v_project_id) INTO v_result;
  EXCEPTION
    WHEN OTHERS THEN
      v_error_occurred := TRUE;
      RAISE NOTICE '✓ PASSED: Exception raised as expected: %', SQLERRM;
  END;

  IF NOT v_error_occurred THEN
    RAISE EXCEPTION 'FAILED: No exception raised for non-existent story';
  END IF;

  RAISE NOTICE 'TEST CASE 5: ALL CHECKS PASSED ✓';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- FINAL SUMMARY
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '==============================================================================';
  RAISE NOTICE 'ALL TEST CASES COMPLETED SUCCESSFULLY ✓';
  RAISE NOTICE '==============================================================================';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '  ✓ Test 1: Story with incoming dependencies (no journey maps)';
  RAISE NOTICE '  ✓ Test 2: Story with NO incoming dependencies';
  RAISE NOTICE '  ✓ Test 3: Story with BOTH journey maps AND incoming dependencies';
  RAISE NOTICE '  ✓ Test 4: Edge case - duplicate dependencies';
  RAISE NOTICE '  ✓ Test 5: Error handling - non-existent story';
  RAISE NOTICE '';
  RAISE NOTICE 'The updated delete_user_story_with_cascade() function correctly:';
  RAISE NOTICE '  1. Deletes the target story';
  RAISE NOTICE '  2. Removes all references from other stories dependencies arrays';
  RAISE NOTICE '  3. Deletes cascade journey maps (existing functionality)';
  RAISE NOTICE '  4. Returns accurate statistics for all operations';
  RAISE NOTICE '  5. Handles errors appropriately';
  RAISE NOTICE '==============================================================================';
END $$;

-- ============================================================================
-- ROLLBACK TO PREVENT ACTUAL CHANGES DURING TESTING
-- ============================================================================
-- IMPORTANT: Always rollback when testing!
ROLLBACK;

-- To actually keep the test data, replace ROLLBACK with COMMIT
-- But only do this if you want to keep the test records!
