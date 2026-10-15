import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { successResponse, errorResponse } from '@/lib/utils/api'
import { reorderUserStoriesSchema } from '@/lib/validations/user-story'
import type { UserStory } from '@/lib/types/database'

type RouteContext = {
  params: Promise<{ id: string }>
}

/**
 * PATCH /api/projects/[id]/user-stories/reorder
 * Bulk update priority_order for multiple user stories
 *
 * This endpoint uses Supabase's upsert functionality to update multiple stories
 * in a single operation. All stories must belong to the same project.
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: projectId } = await context.params
    const supabase = await createClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return errorResponse('Unauthorized', 401)
    }

    // Parse request body
    const body = await request.json()

    // Validate request body
    const parseResult = reorderUserStoriesSchema.safeParse(body)

    if (!parseResult.success) {
      return errorResponse(
        `Invalid request body: ${parseResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
        400
      )
    }

    const { stories } = parseResult.data

    // Verify project exists and user has access
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return errorResponse('Project not found or access denied', 404)
    }

    // Extract story IDs for validation
    const storyIds = stories.map(s => s.id)

    // Verify all stories exist and belong to this project
    const { data: existingStories, error: fetchError } = await supabase
      .from('user_stories')
      .select('id, project_id')
      .in('id', storyIds)

    if (fetchError) {
      console.error('Error fetching stories for validation:', fetchError)
      return errorResponse('Failed to validate stories', 500)
    }

    if (!existingStories || existingStories.length !== storyIds.length) {
      return errorResponse('One or more stories not found', 404)
    }

    const invalidStories = existingStories.filter(s => s.project_id !== projectId)
    if (invalidStories.length > 0) {
      return errorResponse('All stories must belong to the same project', 400)
    }

    // Update priority_order for all stories
    // We'll do this in a series of individual updates since Supabase doesn't support
    // bulk updates with different values easily. In production, this could be optimized
    // with a stored procedure or by using Supabase's RPC functionality.
    const updatePromises = stories.map(({ id, priority_order }) =>
      supabase
        .from('user_stories')
        .update({ priority_order, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('project_id', projectId) // Extra safety check
        .select()
        .single()
    )

    const results = await Promise.all(updatePromises)

    // Check for errors
    const errors = results.filter(r => r.error)
    if (errors.length > 0) {
      console.error('Errors updating story order:', errors)
      return errorResponse('Failed to update some stories', 500)
    }

    // Extract successful updates
    const updatedStories = results
      .filter(r => r.data)
      .map(r => r.data as UserStory)

    return successResponse({
      updated: updatedStories.length,
      stories: updatedStories
    })
  } catch (error) {
    console.error('Unexpected error in PATCH /api/projects/[projectId]/user-stories/reorder:', error)
    return errorResponse('Internal server error', 500)
  }
}
