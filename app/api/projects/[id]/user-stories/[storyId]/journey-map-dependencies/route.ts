import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { successResponse, errorResponse } from '@/lib/utils/api'

type RouteContext = {
  params: Promise<{ id: string; storyId: string }>
}

interface JourneyMapDependency {
  id: string
  title: string
  created_at: string
  persona_id: string
}

interface DependencyResponse {
  journeyMaps: JourneyMapDependency[]
  count: number
}

interface TimelineEntry {
  journey_map_id: string
  user_journey_maps: JourneyMapDependency | JourneyMapDependency[] | null
}

/**
 * GET /api/projects/[id]/user-stories/[storyId]/journey-map-dependencies
 * Check if a user story is referenced in any journey maps and return the list
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

    // First, verify the user story exists and belongs to this project
    const { data: story, error: storyError } = await supabase
      .from('user_stories')
      .select('id, project_id')
      .eq('id', storyId)
      .eq('project_id', projectId)
      .single()

    if (storyError || !story) {
      if (storyError?.code === 'PGRST116') {
        return errorResponse('User story not found', 404)
      }
      console.error('Error fetching user story:', storyError)
      return errorResponse('Failed to fetch user story', 500)
    }

    // Query to fetch all journey maps that reference this user story
    // Join user_journey_map_timeline with user_journey_maps to get full details
    const { data: timelineEntries, error: timelineError } = await supabase
      .from('user_journey_map_timeline')
      .select(`
        journey_map_id,
        user_journey_maps (
          id,
          title,
          created_at,
          persona_id
        )
      `)
      .eq('user_story_id', storyId)

    if (timelineError) {
      console.error('Error fetching journey map dependencies:', timelineError)
      return errorResponse('Failed to fetch journey map dependencies', 500)
    }

    // Extract unique journey maps (a story might appear multiple times in one journey map)
    const journeyMapsMap = new Map<string, JourneyMapDependency>()

    if (timelineEntries) {
      (timelineEntries as TimelineEntry[]).forEach((entry) => {
        if (entry.user_journey_maps) {
          // Normalize to array (Supabase might return single object or array)
          const journeyMaps = Array.isArray(entry.user_journey_maps)
            ? entry.user_journey_maps
            : [entry.user_journey_maps]

          journeyMaps.forEach((journeyMap) => {
            // Ensure we only add each journey map once
            if (!journeyMapsMap.has(journeyMap.id)) {
              journeyMapsMap.set(journeyMap.id, {
                id: journeyMap.id,
                title: journeyMap.title,
                created_at: journeyMap.created_at,
                persona_id: journeyMap.persona_id
              })
            }
          })
        }
      })
    }

    // Convert map to array and sort by creation date (newest first)
    const journeyMaps = Array.from(journeyMapsMap.values())
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    const response: DependencyResponse = {
      journeyMaps,
      count: journeyMaps.length
    }

    return successResponse(response)
  } catch (error) {
    console.error('Unexpected error in GET /api/projects/[id]/user-stories/[storyId]/journey-map-dependencies:', error)
    return errorResponse('Internal server error', 500)
  }
}
