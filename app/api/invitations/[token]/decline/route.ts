import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { successResponse, errorResponse } from '@/lib/utils/api'

type RouteContext = {
  params: Promise<{ token: string }>
}

/**
 * POST /api/invitations/[token]/decline
 * Decline a project invitation (optional authentication)
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { token } = await context.params
    const supabase = await createClient()

    // Fetch invitation details (no auth required for declining)
    const { data: invitation, error: invitationError } = await supabase
      .from('project_invitations')
      .select('id, status, expires_at')
      .eq('token', token)
      .single()

    if (invitationError || !invitation) {
      return errorResponse('Invitation not found', 404)
    }

    // Check if invitation has expired
    const expiresAt = new Date(invitation.expires_at)
    const isExpired = expiresAt < new Date()

    if (isExpired || invitation.status === 'expired') {
      return errorResponse('Invitation has expired', 410, 'INVITATION_EXPIRED')
    }

    // Check if invitation has been revoked
    if (invitation.status === 'revoked') {
      return errorResponse('Invitation has been revoked', 410, 'INVITATION_REVOKED')
    }

    // Check if invitation already accepted
    if (invitation.status === 'accepted') {
      return errorResponse('Invitation has already been accepted', 410, 'INVITATION_ACCEPTED')
    }

    // Check if invitation already declined
    if (invitation.status === 'declined') {
      return successResponse({
        message: 'Invitation already declined',
      })
    }

    // Only pending invitations can be declined
    if (invitation.status !== 'pending') {
      return errorResponse('Invitation cannot be declined', 400)
    }

    // Update invitation status to declined
    const { error: updateError } = await supabase
      .from('project_invitations')
      .update({
        status: 'declined',
        updated_at: new Date().toISOString(),
      })
      .eq('id', invitation.id)

    if (updateError) {
      console.error('Error declining invitation:', updateError)
      return errorResponse('Failed to decline invitation', 500)
    }

    return successResponse({
      message: 'Invitation declined',
    })
  } catch (error) {
    console.error('Unexpected error in POST /api/invitations/[token]/decline:', error)
    return errorResponse('Internal server error', 500)
  }
}
