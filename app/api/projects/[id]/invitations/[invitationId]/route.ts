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

    // Get invitation details
    const { data: invitation, error: invitationError } = await supabase
      .from('project_invitations')
      .select('id, project_id, status, inviter_id')
      .eq('id', invitationId)
      .eq('project_id', projectId)
      .single()

    if (invitationError || !invitation) {
      return errorResponse('Invitation not found', 404)
    }

    // Check if user has permission (project owner, admin, or the person who sent the invitation)
    const { data: project } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', projectId)
      .single()

    const { data: membership } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .single()

    const isOwner = project?.user_id === user.id
    const isAdmin = membership?.role === 'owner' || membership?.role === 'editor'
    const isInviter = invitation.inviter_id === user.id

    if (!isOwner && !isAdmin && !isInviter) {
      return errorResponse('You do not have permission to revoke this invitation', 403)
    }

    // Check if invitation can be revoked
    if (invitation.status === 'accepted') {
      return errorResponse('Cannot revoke an accepted invitation', 400)
    }

    if (invitation.status === 'revoked') {
      return errorResponse('Invitation has already been revoked', 400)
    }

    // Update invitation status to revoked
    const { error: updateError } = await supabase
      .from('project_invitations')
      .update({ status: 'revoked' })
      .eq('id', invitationId)

    if (updateError) {
      console.error('Error revoking invitation:', updateError)
      return errorResponse('Failed to revoke invitation', 500)
    }

    return successResponse({ message: 'Invitation revoked successfully' })
  } catch (error) {
    console.error('Unexpected error in DELETE /api/projects/[id]/invitations/[invitationId]:', error)
    return errorResponse('Internal server error', 500)
  }
}
