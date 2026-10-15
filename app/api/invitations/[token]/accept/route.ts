import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { successResponse, errorResponse } from '@/lib/utils/api'

type RouteContext = {
  params: Promise<{ token: string }>
}

/**
 * POST /api/invitations/[token]/accept
 * Accept a project invitation
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { token } = await context.params
    const supabase = await createClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return errorResponse('Unauthorized - Please login to accept invitation', 401)
    }

    // Get user's email from profile
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single()

    if (!userProfile) {
      return errorResponse('User profile not found', 404)
    }

    // Fetch invitation details
    const { data: invitation, error: invitationError } = await supabase
      .from('project_invitations')
      .select(`
        id,
        project_id,
        invitee_email,
        status,
        expires_at,
        project:projects(id, name)
      `)
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
      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('project_members')
        .select('id')
        .eq('project_id', invitation.project_id)
        .eq('user_id', user.id)
        .single()

      if (existingMember) {
        return successResponse({
          message: 'You are already a member of this project',
          project_id: invitation.project_id,
          project_name: invitation.project?.name,
          already_member: true,
        })
      }
    }

    // Check if invitation was declined
    if (invitation.status === 'declined') {
      return errorResponse('Invitation was declined', 410, 'INVITATION_DECLINED')
    }

    // Optional: Verify logged-in user's email matches invitation email
    // This is commented out to allow flexibility, but can be enabled for stricter control
    // const normalizedUserEmail = userProfile.email.toLowerCase()
    // const normalizedInviteeEmail = invitation.invitee_email.toLowerCase()
    // if (normalizedUserEmail !== normalizedInviteeEmail) {
    //   return errorResponse(
    //     'This invitation was sent to a different email address',
    //     400,
    //     'EMAIL_MISMATCH'
    //   )
    // }

    // Call the database function to accept invitation atomically
    const { data: result, error: acceptError } = await supabase
      .rpc('accept_project_invitation', {
        p_token: token,
        p_user_id: user.id,
      })

    if (acceptError) {
      console.error('Error accepting invitation:', acceptError)
      return errorResponse('Failed to accept invitation', 500)
    }

    // The function returns a table with success, message, and project_id
    const acceptResult = result?.[0]

    if (!acceptResult || !acceptResult.success) {
      const message = acceptResult?.message || 'Failed to accept invitation'
      return errorResponse(message, 400)
    }

    return successResponse({
      message: acceptResult.message,
      project_id: acceptResult.project_id,
      project_name: invitation.project?.name,
    })
  } catch (error) {
    console.error('Unexpected error in POST /api/invitations/[token]/accept:', error)
    return errorResponse('Internal server error', 500)
  }
}
