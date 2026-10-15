import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { successResponse, errorResponse } from '@/lib/utils/api'
import type { UserStory } from '@/lib/types/database'

type RouteContext = {
  params: Promise<{ id: string; storyId: string }>
}

interface DependencyResponse {
  story: UserStory
  outgoing: UserStory[]
  incoming: UserStory[]
}

/**
 * GET /api/projects/[id]/user-stories/[storyId]/dependencies
 * Retrieve all dependencies for a specific user story
 *
 * Returns bidirectional dependencies:
 * - Outgoing: Array of UserStory objects that this story depends on
 * - Incoming: Array of UserStory objects that depend on this story
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

    // Fetch the target story
    const { data: story, error: storyError } = await supabase
      .from('user_stories')
      .select('*')
      .eq('id', storyId)
      .eq('project_id', projectId)
      .single()

    if (storyError) {
      if (storyError.code === 'PGRST116') {
        return errorResponse('User story not found', 404)
      }
      console.error('Error fetching user story:', storyError)
      return errorResponse('Failed to fetch user story', 500)
    }

    const typedStory = story as UserStory

    // Extract outgoing dependencies (stories this story depends on)
    const outgoingStoryIds: string[] = typedStory.dependencies || []

    // Fetch outgoing dependency stories
    let outgoing: UserStory[] = []
    if (outgoingStoryIds.length > 0) {
      const { data, error } = await supabase
        .from('user_stories')
        .select('*')
        .in('id', outgoingStoryIds)
        .eq('project_id', projectId)

      if (error) {
        console.error('Error fetching outgoing dependencies:', error)
        return errorResponse('Failed to fetch outgoing dependencies', 500)
      }

      outgoing = data as UserStory[]
    }

    // Find incoming dependencies (stories that depend on this story)
    // We need to search all stories in the project and check their dependencies array
    const { data: allStories, error: allError } = await supabase
      .from('user_stories')
      .select('*')
      .eq('project_id', projectId)

    if (allError) {
      console.error('Error fetching all stories for incoming deps:', allError)
      return errorResponse('Failed to fetch incoming dependencies', 500)
    }

    // Filter stories that have this story in their dependencies
    const incoming: UserStory[] = []

    for (const otherStory of (allStories as UserStory[])) {
      if (otherStory.id === storyId) continue

      const deps: string[] = otherStory.dependencies || []
      const hasDependency = deps.includes(storyId)

      if (hasDependency) {
        incoming.push(otherStory)
      }
    }

    const response: DependencyResponse = {
      story: typedStory,
      outgoing,
      incoming
    }

    return successResponse(response)
  } catch (error) {
    console.error('Unexpected error in GET /api/projects/[projectId]/user-stories/[storyId]/dependencies:', error)
    return errorResponse('Internal server error', 500)
  }
}
