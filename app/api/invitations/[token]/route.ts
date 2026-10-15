import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { successResponse, errorResponse } from '@/lib/utils/api'

type RouteContext = {
  params: Promise<{ token: string }>
}

/**
 * GET /api/invitations/[token]
 * Get invitation details by token (public endpoint for invitation acceptance page)
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { token } = await context.params
    const supabase = await createClient()

    // Fetch invitation (now includes embedded project and inviter names)
    const { data: invitation, error } = await supabase
      .from('project_invitations')
      .select('*')
      .eq('token', token)
      .single()

    if (error || !invitation) {
      return errorResponse('Invitation not found', 404)
    }

    // Build the response with embedded data
    const fullInvitation = {
      ...invitation,
      // Create nested objects for backward compatibility with frontend
      project: {
        id: invitation.project_id,
        name: invitation.project_name,
        description: invitation.project_description,
      },
      inviter: {
        id: invitation.inviter_id,
        full_name: invitation.inviter_name,
        email: invitation.inviter_email,
      },
    }

    // Check if invitation has expired
    const expiresAt = new Date(fullInvitation.expires_at)
    const isExpired = expiresAt < new Date() || fullInvitation.status === 'expired'

    // Check if invitation has been revoked
    if (fullInvitation.status === 'revoked') {
      return errorResponse('Invitation has been revoked', 410, 'INVITATION_REVOKED')
    }

    // Check if invitation has already been accepted
    if (fullInvitation.status === 'accepted') {
      return errorResponse('Invitation already accepted', 410, 'INVITATION_ACCEPTED')
    }

    // Check if invitation has been declined
    if (fullInvitation.status === 'declined') {
      return errorResponse('Invitation was declined', 410, 'INVITATION_DECLINED')
    }

    // Check if invitation has expired
    if (isExpired) {
      // Update status to expired if not already
      if (fullInvitation.status === 'pending') {
        await supabase
          .from('project_invitations')
          .update({ status: 'expired', updated_at: new Date().toISOString() })
          .eq('token', token)
      }
      return errorResponse('Invitation has expired', 410, 'INVITATION_EXPIRED')
    }

    return successResponse({
      invitation: {
        id: fullInvitation.id,
        email: fullInvitation.invitee_email,
        status: fullInvitation.status,
        role: fullInvitation.role,
        message: fullInvitation.message,
        expires_at: fullInvitation.expires_at,
        invited_at: fullInvitation.invited_at,
        is_expired: isExpired,
        project: fullInvitation.project,
        inviter: fullInvitation.inviter,
      },
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/invitations/[token]:', error)
    return errorResponse('Internal server error', 500)
  }
}
