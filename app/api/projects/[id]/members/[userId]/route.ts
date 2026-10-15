import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { successResponse, errorResponse } from '@/lib/utils/api'

type RouteContext = {
  params: Promise<{ id: string; userId: string }>
}

/**
 * DELETE /api/projects/[id]/members/[userId]
 * Remove a member from a project
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id, userId } = await context.params
    const supabase = await createClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return errorResponse('Unauthorized', 401)
    }

    // Check if user is the project owner
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', id)
      .single()

    if (projectError) {
      return errorResponse('Project not found', 404)
    }

    if (project.user_id !== user.id) {
      return errorResponse('Only project owners can remove members', 403)
    }

    // Prevent removing the owner
    if (userId === project.user_id) {
      return errorResponse('Cannot remove the project owner', 400)
    }

    // Remove member
    const { error } = await supabase
      .from('project_members')
      .delete()
      .eq('project_id', id)
      .eq('user_id', userId)

    if (error) {
      console.error('Error removing project member:', error)
      return errorResponse('Failed to remove member', 500)
    }

    return successResponse({ success: true, user_id: userId })
  } catch (error) {
    console.error('Unexpected error in DELETE /api/projects/[id]/members/[userId]:', error)
    return errorResponse('Internal server error', 500)
  }
}
