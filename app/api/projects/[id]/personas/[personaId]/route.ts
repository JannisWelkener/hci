import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Persona } from '@/lib/types/database'
import { errorResponse, successResponse } from '@/lib/utils/api'
import z from 'zod'

interface RouteContext {
  params: Promise<{
    id: string
    personaId: string
  }>
}

const updatePersonaSchema = z.object({
  photo_url: z.string().optional().nullable(),

  name: z.string().min(1, 'Name is required'),
  role: z.string().optional().nullable(),

  age: z.string().optional().nullable(),
  occupation: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  relationship_status: z.string().optional().nullable(),
  education: z.string().optional().nullable(),

  buzzwords: z.array(z.string()).optional().nullable(),

  personality_01: z.number().int(),
  personality_02: z.number().int(),
  personality_03: z.number().int(),
  personality_04: z.number().int(),

  motivation: z.string().optional().nullable(),
  goals: z.array(z.string()).optional().nullable(),
  pain_points: z.array(z.string()).optional().nullable(),

  skill_01: z.number().int(),
  skill_02: z.number().int(),
  skill_03: z.number().int(),

  // metadata: z.record(z.any()).optional().nullable(),
})


/**
 * GET /api/projects/[id]/personas/[personaId]
 * Retrieve a single persona for a specific project
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: projectId, personaId } = await context.params
    const supabase = await createClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return errorResponse('Unauthorized', 401)
    }

    // Fetch the specific persona
    const { data: persona, error } = await supabase
      .from('personas')
      .select('*')
      .eq('id', personaId)
      .eq('project_id', projectId)
      .single()

    if (error) {
      console.error('Error fetching persona:', error)
      return errorResponse('Failed to fetch persona', 500)
    }

    if (!persona) {
      return errorResponse('Persona not found', 404)
    }

    return successResponse(persona as Persona)
  } catch (error) {
    console.error('Unexpected error in GET /api/personas/[personaId]:', error)
    return errorResponse('Internal server error', 500)
  }
}


export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: projectId, personaId } = await context.params
    const supabase = await createClient()

    // Verify authentication
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return errorResponse('Unauthorized', 401)
    }

    // Delete the specific persona
    const { error } = await supabase
      .from('personas')
      .delete()
      .eq('id', personaId)
      .eq('project_id', projectId)
      .eq('created_by', user.id)

    if (error) {
      console.error('Error deleting persona:', error)
      return errorResponse('Failed to delete persona '+error.cause+" "+error.code+" "+error.details+" "+error.hint+" "+error.message+" "+error.name+" "+error.stack, 500)
    }

    return successResponse({ message: 'Persona deleted successfully' })
  } catch (error) {
    console.error('Unexpected error in DELETE /api/personas/[personaId]:', error)
    return errorResponse('Internal server error', 500)
  }
}

/**
 * PUT /api/projects/[id]/personas/[personaId]
 * Update an existing persona
 */
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id, personaId } = await context.params
    const supabase = await createClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return errorResponse('Unauthorized', 401)
    }

    // Parse and validate body
    const body = await request.json()
    const parseResult = updatePersonaSchema.safeParse(body)

    if (!parseResult.success) {
      return errorResponse(
        `Validation error: ${parseResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
        400
      )
    }

    const personaData = parseResult.data

    console.log("Updating persona:", personaId, personaData)

    // Update the persona by ID
    const { data: persona, error } = await supabase
      .from('personas')
      .update({
        ...personaData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', personaId)
      .eq('project_id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating persona:', error)
      return errorResponse('Failed to update persona', 500)
    }

    return successResponse(persona as Persona, 200)
  } catch (error) {
    console.error('Unexpected error in PUT /api/projects/[id]/personas/[personaId]:', error)
    return errorResponse('Internal server error', 500)
  }
}