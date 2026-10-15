import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { successResponse, errorResponse } from '@/lib/utils/api'
import type { Persona } from '@/lib/types/database'

type RouteContext = {
  params: Promise<{ id: string }>
}

const createPersonaSchema = z.object({
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
 * GET /api/projects/[id]/personas
 * Retrieve all personas for a specific project
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

    // Fetch all personas for the given project_id
    const { data: personas, error } = await supabase
      .from('personas')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching personas:', error)
      return errorResponse('Failed to fetch personas', 500)
    }

    return successResponse(personas as Persona[])
  } catch (error) {
    console.error('Unexpected error in GET /api/personas:', error)
    return errorResponse('Internal server error', 500)
  }
}

/**
 * POST /api/projects/[id]/personas
 * Add a new persona to a specific project
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
    const parseResult = createPersonaSchema.safeParse(body)

    if (!parseResult.success) {
      return errorResponse(
        `Validation error: ${parseResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
        400
      )
    }

    const personaData = parseResult.data

    console.log("Inserted data:", personaData)

    // Insert new persona
    const { data: persona, error } = await supabase
      .from('personas')
      .insert({
        ...personaData,
        project_id: id,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error inserting persona:', error)
      return errorResponse('Failed to create persona', 500)
    }

    return successResponse(persona as Persona, 201)
  } catch (error) {
    console.error('Unexpected error in POST /api/projects/[id]/personas:', error)
    return errorResponse('Internal server error', 500)
  }
}