// File: app/api/projects/[id]/user-journey-maps/[mapId]/route.ts

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { successResponse, errorResponse } from '@/lib/utils/api'
import { updateUserJourneyMapSchema } from '@/lib/validations/user-journey-map'
import type { UserJourneyMap } from '@/lib/types/database'

type RouteContext = {
  params: Promise<{ id: string; mapId: string }>
}

/**
 * GET /api/projects/[id]/user-journey-maps/[mapId]
 * Retrieve a specific user journey map by ID
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: projectId, mapId } = await context.params
    const supabase = await createClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return errorResponse('Unauthorized', 401)
    }

    // Fetch user journey map
    const { data: journeyMap, error } = await supabase
      .from('user_journey_maps')
      .select('*')
      .eq('id', mapId)
      .eq('project_id', projectId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return errorResponse('User journey map not found', 404)
      }
      console.error('Error fetching user journey map:', error)
      return errorResponse('Failed to fetch user journey map', 500)
    }

    // Fetch timeline entries
    const { data: timelineEntries, error: timelineError } = await supabase
      .from('user_journey_map_timeline')
      .select('*')
      .eq('journey_map_id', mapId)
      .order('position', { ascending: true })

    if (timelineError) {
      console.error('Error fetching timeline:', timelineError)
      return errorResponse('Failed to fetch timeline', 500)
    }

    // Combine journey map with timeline
    const journeyMapWithTimeline = {
      ...journeyMap,
      timeline: timelineEntries || [],
    }

    return successResponse(journeyMapWithTimeline as UserJourneyMap)
  } catch (error) {
    console.error('Unexpected error in GET /api/projects/[id]/user-journey-maps/[mapId]:', error)
    return errorResponse('Internal server error', 500)
  }
}

/**
 * PATCH /api/projects/[id]/user-journey-maps/[mapId]
 * Update a user journey map
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: projectId, mapId } = await context.params
    const supabase = await createClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return errorResponse('Unauthorized', 401)
    }

    // Parse request body
    const body = await request.json()

    // Validate request body
    const parseResult = updateUserJourneyMapSchema.safeParse(body)

    if (!parseResult.success) {
      return errorResponse(
        `Validation error: ${parseResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
        400
      )
    }

    const { timeline, ...journeyMapUpdates } = parseResult.data

    // Update user journey map fields (RLS policies will ensure user has access)
    const { data: journeyMap, error } = await supabase
      .from('user_journey_maps')
      .update(journeyMapUpdates)
      .eq('id', mapId)
      .eq('project_id', projectId)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return errorResponse('User journey map not found or access denied', 404)
      }
      console.error('Error updating user journey map:', error)
      return errorResponse('Failed to update user journey map', 500)
    }

    // Update timeline if provided
    if (timeline && timeline.length > 0) {
      // Delete existing timeline entries
      const { error: deleteError } = await supabase
        .from('user_journey_map_timeline')
        .delete()
        .eq('journey_map_id', mapId)

      if (deleteError) {
        console.error('Error deleting timeline entries:', deleteError)
        return errorResponse('Failed to update timeline', 500)
      }

      // Insert new timeline entries
      const timelineEntries = timeline.map((user_story_id, index) => ({
        journey_map_id: mapId,
        user_story_id,
        position: index,
      }))

      const { error: insertError } = await supabase
        .from('user_journey_map_timeline')
        .insert(timelineEntries)

      if (insertError) {
        console.error('Error inserting timeline entries:', insertError)
        return errorResponse('Failed to update timeline', 500)
      }
    }

    // Fetch updated timeline
    const { data: timelineEntries } = await supabase
      .from('user_journey_map_timeline')
      .select('*')
      .eq('journey_map_id', mapId)
      .order('position', { ascending: true })

    // Combine journey map with timeline
    const journeyMapWithTimeline = {
      ...journeyMap,
      timeline: timelineEntries || [],
    }

    return successResponse(journeyMapWithTimeline as UserJourneyMap)
  } catch (error) {
    console.error('Unexpected error in PATCH /api/projects/[id]/user-journey-maps/[mapId]:', error)
    return errorResponse('Internal server error', 500)
  }
}

/**
 * DELETE /api/projects/[id]/user-journey-maps/[mapId]
 * Delete a user journey map
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: projectId, mapId } = await context.params
    const supabase = await createClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return errorResponse('Unauthorized', 401)
    }

    // Delete user journey map (timeline entries will be deleted automatically via CASCADE)
    // Note: We don't delete timeline entries manually because there's a trigger that prevents
    // deleting the last story from a timeline. CASCADE deletes bypass this trigger.
    const { error } = await supabase
      .from('user_journey_maps')
      .delete()
      .eq('id', mapId)
      .eq('project_id', projectId)

    if (error) {
      console.error('Error deleting user journey map:', error)
      return errorResponse('Failed to delete user journey map or access denied', 500)
    }

    return successResponse({ success: true, id: mapId })
  } catch (error) {
    console.error('Unexpected error in DELETE /api/projects/[id]/user-journey-maps/[mapId]:', error)
    return errorResponse('Internal server error', 500)
  }
}
