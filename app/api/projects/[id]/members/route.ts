import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { successResponse, errorResponse } from '@/lib/utils/api'
import { z } from 'zod'
import type { ProjectMember } from '@/lib/types/database'

type RouteContext = {
  params: Promise<{ id: string }>
}

const addMemberSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  role: z.enum(['owner', 'editor', 'viewer', 'member']).optional().default('member'),
})

/**
 * GET /api/projects/[id]/members
 * Get all members of a project
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

    // Fetch members with profile information
    const { data: members, error } = await supabase
      .from('project_members')
      .select('*, profile:profiles!user_id(*)')
      .eq('project_id', id)

    if (error) {
      console.error('Error fetching project members:', error)
      return errorResponse('Failed to fetch project members', 500)
    }

    // Transform the response
    const membersWithProfiles = members.map((pm: Record<string, unknown>) => ({
      id: pm.id,
      project_id: pm.project_id,
      user_id: pm.user_id,
      role: pm.role,
      joined_at: pm.joined_at,
      created_at: pm.created_at,
      updated_at: pm.updated_at,
      profile: pm.profile,
    }))

    return successResponse({ members: membersWithProfiles })
  } catch (error) {
    console.error('Unexpected error in GET /api/projects/[id]/members:', error)
    return errorResponse('Internal server error', 500)
  }
}

/**
 * POST /api/projects/[id]/members
 * Add a member to a project
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

    // Parse request body
    const body = await request.json()

    // Validate request body
    const parseResult = addMemberSchema.safeParse(body)

    if (!parseResult.success) {
      return errorResponse(
        `Validation error: ${parseResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
        400
      )
    }

    const { user_id, role } = parseResult.data

    // Check if user is the project owner (RLS will enforce this automatically, but we can check explicitly)
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', id)
      .single()

    if (projectError) {
      return errorResponse('Project not found', 404)
    }

    if (project.user_id !== user.id) {
      return errorResponse('Only project owners can add members', 403)
    }

    // Add member
    const { data: member, error } = await supabase
      .from('project_members')
      .insert({
        project_id: id,
        user_id,
        role,
      })
      .select()
      .single()

    if (error) {
      // Check for duplicate member error
      if (error.code === '23505') {
        return errorResponse('User is already a member of this project', 409)
      }
      console.error('Error adding project member:', error)
      return errorResponse('Failed to add member', 500)
    }

    return successResponse(member as ProjectMember, 201)
  } catch (error) {
    console.error('Unexpected error in POST /api/projects/[id]/members:', error)
    return errorResponse('Internal server error', 500)
  }
}
