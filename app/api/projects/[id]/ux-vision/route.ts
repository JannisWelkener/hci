import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { successResponse, errorResponse } from '@/lib/utils/api'
import type { UXVision } from '@/lib/types/database'

type RouteContext = {
  params: Promise<{ id: string }>
}

const upsertUXVisionSchema = z.object({
  vision: z.string().min(1, 'Vision is required'),
})

/**
 * GET /api/projects/[id]/ux-vision
 * Retrieve the UX Vision for a specific project
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return errorResponse('Unauthorized', 401)
    }

    // Fetch the UX Vision for the given project_id
    const { data: vision, error } = await supabase
      .from('ux_visions')
      .select('*')
      .eq('project_id', id)
      .maybeSingle()

    if (error) {
      console.error('Error fetching UX vision:', error)
      return errorResponse('Failed to fetch UX vision', 500)
    }

    return successResponse(vision as UXVision | null)
  } catch (error) {
    console.error('Unexpected error in GET /api/projects/[id]/ux-vision:', error)
    return errorResponse('Internal server error', 500)
  }
}

/**
 * POST /api/projects/[id]/ux-vision
 * Create or update the UX Vision for a specific project
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return errorResponse('Unauthorized', 401)
    }

    // Parse and validate body
    const body = await request.json()
    const parseResult = upsertUXVisionSchema.safeParse(body)

    if (!parseResult.success) {
      return errorResponse(
        `Validation error: ${parseResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
        400
      )
    }

    const visionData = parseResult.data

    // Check if a vision already exists for this project
    const { data: existingVision } = await supabase
      .from('ux_visions')
      .select('*')
      .eq('project_id', id)
      .maybeSingle()

    if (existingVision) {
      // Update existing vision
      const { data: updatedVision, error } = await supabase
        .from('ux_visions')
        .update({
          vision: visionData.vision,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingVision.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating UX vision:', error)
        return errorResponse('Failed to update UX vision', 500)
      }

      return successResponse(updatedVision as UXVision, 200)
    } else {
      // Insert new vision
      const { data: newVision, error } = await supabase
        .from('ux_visions')
        .insert({
          vision: visionData.vision,
          project_id: id,
          created_by: user.id,
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating UX vision:', error)
        return errorResponse('Failed to create UX vision', 500)
      }

      return successResponse(newVision as UXVision, 201)
    }
  } catch (error) {
    console.error('Unexpected error in POST /api/projects/[id]/ux-vision:', error)
    return errorResponse('Internal server error', 500)
  }
}
