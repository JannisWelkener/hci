import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { successResponse, errorResponse } from '@/lib/utils/api'
import { z } from 'zod'
import type { Project, PhaseStatus } from '@/lib/types/database'

type RouteContext = {
  params: Promise<{ id: string }>
}

const updatePhaseSchema = z.object({
  phase: z.enum([
    'understand_context',
    'specify_requirements',
    'produce_design_solutions',
    'evaluate_against_requirements',
  ]),
  status: z.enum(['not_started', 'in_progress', 'completed']),
})

/**
 * PATCH /api/projects/[id]/phases
 * Update the status of a specific phase
 */
export async function PATCH(
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

    // Parse request body
    const body = await request.json()

    // Validate request body
    const parseResult = updatePhaseSchema.safeParse(body)

    if (!parseResult.success) {
      return errorResponse(
        `Validation error: ${parseResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
        400
      )
    }

    const { phase, status } = parseResult.data

    // Fetch current project to get phase_status
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('phase_status, current_phase')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return errorResponse('Project not found', 404)
      }
      console.error('Error fetching project:', fetchError)
      return errorResponse('Failed to fetch project', 500)
    }

    // Update the specific phase status
    const currentPhaseStatus = project.phase_status as PhaseStatus
    const updatedPhaseStatus: PhaseStatus = {
      ...currentPhaseStatus,
      [phase]: status,
    }

    // Optionally update current_phase if this phase is now in_progress
    const updates: Record<string, unknown> = {
      phase_status: updatedPhaseStatus,
    }

    if (status === 'in_progress') {
      updates.current_phase = phase
    }

    // Update project
    const { data: updatedProject, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating project phase:', error)
      return errorResponse('Failed to update phase status', 500)
    }

    return successResponse(updatedProject as Project)
  } catch (error) {
    console.error('Unexpected error in PATCH /api/projects/[id]/phases:', error)
    return errorResponse('Internal server error', 500)
  }
}
