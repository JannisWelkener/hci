import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { successResponse, errorResponse } from '@/lib/utils/api'

type RouteContext = {
  params: Promise<{ id: string; invitationId: string }>
}

/**
 * DELETE /api/projects/[id]/invitations/[invitationId]
 * Revoke a project invitation
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: projectId, invitationId } = await context.params
    const supabase = await createClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return errorResponse('Unauthorized', 401)
    }

    // Verify user is project owner
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return errorResponse('Project not found', 404)
    }

    if (project.user_id !== user.id) {
      return errorResponse('You must be the project owner to revoke invitations', 403)
    }

    // Get the invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('project_invitations')
      .select('id, status, project_id')
      .eq('id', invitationId)
      .single()

    if (invitationError || !invitation) {
      return errorResponse('Invitation not found', 404)
    }

    // Verify invitation belongs to this project
    if (invitation.project_id !== projectId) {
      return errorResponse('Invitation does not belong to this project', 400)
    }

    // Check if invitation can be revoked (only pending invitations)
    if (invitation.status !== 'pending') {
      return errorResponse('Invitation is no longer pending and cannot be revoked', 400)
    }

    // Update invitation status to revoked
    const { error: updateError } = await supabase
      .from('project_invitations')
      .update({
        status: 'revoked',
        updated_at: new Date().toISOString(),
      })
      .eq('id', invitationId)

    if (updateError) {
      console.error('Error revoking invitation:', updateError)
      return errorResponse('Failed to revoke invitation', 500)
    }

    return successResponse({
      message: 'Invitation revoked successfully',
    })
  } catch (error) {
    console.error('Unexpected error in DELETE /api/projects/[id]/invitations/[invitationId]:', error)
    return errorResponse('Internal server error', 500)
  }
}
