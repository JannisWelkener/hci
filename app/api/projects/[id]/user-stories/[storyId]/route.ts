import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { successResponse, errorResponse } from '@/lib/utils/api'
import { updateUserStorySchema, type UpdateUserStoryInput } from '@/lib/validations/user-story'
import type { UserStory } from '@/lib/types/database'

type RouteContext = {
  params: Promise<{ id: string; storyId: string }>
}

/**
 * GET /api/projects/[id]/user-stories/[storyId]
 * Retrieve a specific user story by ID
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: projectId, storyId } = await context.params
    const supabase = await createClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return errorResponse('Unauthorized', 401)
    }

    // Fetch user story
    const { data: userStory, error } = await supabase
      .from('user_stories')
      .select('*')
      .eq('id', storyId)
      .eq('project_id', projectId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return errorResponse('User story not found', 404)
      }
      console.error('Error fetching user story:', error)
      return errorResponse('Failed to fetch user story', 500)
    }

    return successResponse(userStory as UserStory)
  } catch (error) {
    console.error('Unexpected error in GET /api/projects/[projectId]/user-stories/[storyId]:', error)
    return errorResponse('Internal server error', 500)
  }
}

/**
 * PATCH /api/projects/[id]/user-stories/[storyId]
 * Update a user story
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: projectId, storyId } = await context.params
    const supabase = await createClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return errorResponse('Unauthorized', 401)
    }

    // Parse request body
    const body = await request.json()

    // Validate request body
    const parseResult = updateUserStorySchema.safeParse(body)

    if (!parseResult.success) {
      return errorResponse(
        `Validation error: ${parseResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
        400
      )
    }

    const updates = parseResult.data as UpdateUserStoryInput

    // Validate dependencies if being updated
    if (updates.dependencies && updates.dependencies.length > 0) {
      const dependencyIds = updates.dependencies

      // Prevent self-references
      if (dependencyIds.includes(storyId)) {
        return errorResponse('A user story cannot depend on itself', 400)
      }

      // Check that all dependency stories exist and belong to the same project
      const { data: dependentStories, error: depError } = await supabase
        .from('user_stories')
        .select('id, project_id')
        .in('id', dependencyIds)

      if (depError) {
        console.error('Error validating dependencies:', depError)
        return errorResponse('Failed to validate dependencies', 500)
      }

      if (!dependentStories || dependentStories.length !== dependencyIds.length) {
        const foundIds = dependentStories?.map(s => s.id) || []
        const missingIds = dependencyIds.filter(id => !foundIds.includes(id))
        console.error('Dependency validation failed:', {
          requestedIds: dependencyIds,
          foundIds,
          missingIds
        })
        return errorResponse(
          `One or more dependency stories not found. Missing IDs: ${missingIds.join(', ')}`,
          400
        )
      }

      const invalidDeps = dependentStories.filter(story => story.project_id !== projectId)
      if (invalidDeps.length > 0) {
        return errorResponse('Dependencies must be from the same project', 400)
      }
    }

    // Update user story (RLS policies will ensure user has access)
    const { data: userStory, error } = await supabase
      .from('user_stories')
      .update(updates)
      .eq('id', storyId)
      .eq('project_id', projectId)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return errorResponse('User story not found or access denied', 404)
      }
      console.error('Error updating user story:', error)
      return errorResponse('Failed to update user story', 500)
    }

    return successResponse(userStory as UserStory)
  } catch (error) {
    console.error('Unexpected error in PATCH /api/projects/[projectId]/user-stories/[storyId]:', error)
    return errorResponse('Internal server error', 500)
  }
}

/**
 * DELETE /api/projects/[id]/user-stories/[storyId]
 * Delete a user story and cascade delete dependent journey maps
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: projectId, storyId } = await context.params
    const supabase = await createClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return errorResponse('Unauthorized', 401)
    }

    // Execute cascade deletion using database function
    // This will delete the user story and all dependent journey maps atomically
    const { data: result, error } = await supabase
      .rpc('delete_user_story_with_cascade', {
        p_story_id: storyId,
        p_project_id: projectId
      })

    if (error) {
      console.error('Error executing cascade deletion:', error)

      // Handle specific error cases
      if (error.message?.includes('not found')) {
        return errorResponse('User story not found or access denied', 404)
      }

      return errorResponse('Failed to delete user story', 500)
    }

    // Parse the cascade deletion statistics from the function result
    const stats = result as {
      success: boolean
      deleted: {
        story: boolean
        journeyMaps: number
        timelineEntries: number
      }
      updated?: {
        dependenciesUpdated: number
      }
    }

    return successResponse({
      message: 'User story deleted successfully',
      cascadeDeleted: {
        journeyMaps: stats.deleted.journeyMaps,
        timelineEntries: stats.deleted.timelineEntries
      },
      dependenciesUpdated: stats.updated?.dependenciesUpdated ?? 0
    })
  } catch (error) {
    console.error('Unexpected error in DELETE /api/projects/[projectId]/user-stories/[storyId]:', error)
    return errorResponse('Internal server error', 500)
  }
}
