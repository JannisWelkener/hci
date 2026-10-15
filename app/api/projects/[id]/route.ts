import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { successResponse, errorResponse } from '@/lib/utils/api'
import { updateProjectSchema } from '@/lib/validations/project'
import type { Project, ProjectWithMembers } from '@/lib/types/database'

type RouteContext = {
  params: Promise<{ id: string }>
}

/**
 * GET /api/projects/[id]
 * Retrieve a specific project by ID
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

    // Check if we should include members
    const includeMembers = request.nextUrl.searchParams.get('include')?.includes('members')

    // Fetch project (RLS will check if user is owner OR member)
    const query = supabase
      .from('projects')
      .select(includeMembers ? '*, project_members(*, profiles(*))' : '*')
      .eq('id', id)
      .single()

    const { data: project, error } = await query

    if (error) {
      if (error.code === 'PGRST116') {
        return errorResponse('Project not found', 404)
      }
      console.error('Error fetching project:', error)
      return errorResponse('Failed to fetch project', 500)
    }

    // Transform the response if members are included
    let response: Project | ProjectWithMembers = project as unknown as Project
    const projectData = project as unknown as Record<string, unknown>

    if (includeMembers && projectData.project_members) {
      response = {
        ...projectData,
        members: (projectData.project_members as Array<Record<string, unknown>>).map((pm: Record<string, unknown>) => ({
          id: pm.id,
          project_id: pm.project_id,
          user_id: pm.user_id,
          role: pm.role,
          joined_at: pm.joined_at,
          created_at: pm.created_at,
          updated_at: pm.updated_at,
          profile: pm.profiles,
        })),
      } as ProjectWithMembers

      // Remove the raw project_members data
      delete (response as unknown as Record<string, unknown>).project_members
    }

    return successResponse(response)
  } catch (error) {
    console.error('Unexpected error in GET /api/projects/[id]:', error)
    return errorResponse('Internal server error', 500)
  }
}

/**
 * PATCH /api/projects/[id]
 * Update a project
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
    const parseResult = updateProjectSchema.safeParse(body)

    if (!parseResult.success) {
      return errorResponse(
        `Validation error: ${parseResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
        400
      )
    }

    const updates = parseResult.data

    // Update project (RLS policies will ensure user has access)
    const { data: project, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return errorResponse('Project not found or access denied', 404)
      }
      console.error('Error updating project:', error)
      return errorResponse('Failed to update project', 500)
    }

    return successResponse(project as Project)
  } catch (error) {
    console.error('Unexpected error in PATCH /api/projects/[id]:', error)
    return errorResponse('Internal server error', 500)
  }
}

/**
 * DELETE /api/projects/[id]
 * Delete a project
 */
export async function DELETE(
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

    // Delete project (RLS policies will ensure only owner can delete)
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting project:', error)
      return errorResponse('Failed to delete project or access denied', 500)
    }

    return successResponse({ success: true, id })
  } catch (error) {
    console.error('Unexpected error in DELETE /api/projects/[id]:', error)
    return errorResponse('Internal server error', 500)
  }
}
