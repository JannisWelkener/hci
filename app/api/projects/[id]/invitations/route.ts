import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { successResponse, errorResponse } from '@/lib/utils/api'
import { sendInvitationEmail } from '@/lib/services/email-service'
import { z } from 'zod'
import crypto from 'crypto'

type RouteContext = {
  params: Promise<{ id: string }>
}

const createInvitationSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  role: z.enum(['owner', 'editor', 'viewer', 'member']).optional().default('member'),
  message: z.string().max(500).optional(),
})

/**
 * GET /api/projects/[id]/invitations
 * Get all invitations for a project
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

    // Get status filter from query params
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    // Build query
    let query = supabase
      .from('project_invitations')
      .select(`
        *,
        inviter:profiles!inviter_id(id, full_name, email, avatar_url)
      `)
      .eq('project_id', id)
      .order('invited_at', { ascending: false })

    // Apply status filter if provided
    if (status) {
      query = query.eq('status', status)
    }

    const { data: invitations, error } = await query

    if (error) {
      console.error('Error fetching project invitations:', error)
      return errorResponse('Failed to fetch invitations', 500)
    }

    return successResponse({ invitations: invitations || [] })
  } catch (error) {
    console.error('Unexpected error in GET /api/projects/[id]/invitations:', error)
    return errorResponse('Internal server error', 500)
  }
}

/**
 * POST /api/projects/[id]/invitations
 * Create and send a project invitation
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: projectId } = await context.params
    const supabase = await createClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return errorResponse('Unauthorized', 401)
    }

    // Parse and validate request body
    const body = await request.json()
    const parseResult = createInvitationSchema.safeParse(body)

    if (!parseResult.success) {
      return errorResponse(
        `Validation error: ${parseResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
        400
      )
    }

    const { email, role, message } = parseResult.data

    // Get project details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, user_id')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return errorResponse('Project not found', 404)
    }

    // Check if user has permission to invite (project owner or admin)
    const { data: membership } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .single()

    const isOwner = project.user_id === user.id
    const isAdmin = membership?.role === 'owner' || membership?.role === 'editor'

    if (!isOwner && !isAdmin) {
      return errorResponse('Only project owners and admins can send invitations', 403)
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (existingMember) {
      const { data: membershipCheck } = await supabase
        .from('project_members')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', existingMember.id)
        .single()

      if (membershipCheck) {
        return errorResponse('User is already a member of this project', 409)
      }
    }

    // Check if there's already a pending invitation
    const { data: existingInvitation } = await supabase
      .from('project_invitations')
      .select('id, status')
      .eq('project_id', projectId)
      .eq('invitee_email', email)
      .eq('status', 'pending')
      .single()

    if (existingInvitation) {
      return errorResponse('An invitation has already been sent to this email', 409)
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex')

    // Set expiration (14 days from now)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 14)

    // Get inviter profile
    const { data: inviterProfile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single()

    // Create invitation with embedded project and inviter info
    const { data: invitation, error: invitationError } = await supabase
      .from('project_invitations')
      .insert({
        project_id: projectId,
        invitee_email: email,
        role,
        status: 'pending',
        token,
        inviter_id: user.id,
        message,
        expires_at: expiresAt.toISOString(),
        // Embed project info so it's available even if user doesn't have access yet
        project_name: project.name,
        project_description: project.description,
        // Embed inviter info
        inviter_name: inviterProfile?.full_name || 'A team member',
        inviter_email: inviterProfile?.email || null,
      })
      .select()
      .single()

    if (invitationError) {
      console.error('Error creating invitation:', invitationError)
      return errorResponse('Failed to create invitation', 500)
    }

    // Send invitation email ONLY for real email addresses (not link invitations)
    if (!email.endsWith('@placeholder.local')) {
      try {
        const acceptUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invitations/${token}/accept`

        await sendInvitationEmail({
          to: email,
          inviterName: inviterProfile?.full_name || 'A team member',
          projectName: project.name,
          acceptUrl,
          message,
        })
      } catch (emailError) {
        console.error('Failed to send invitation email:', emailError)
        // Don't fail the request if email fails - invitation is still created
      }
    }

    return successResponse({ invitation }, 201)
  } catch (error) {
    console.error('Unexpected error in POST /api/projects/[id]/invitations:', error)
    return errorResponse('Internal server error', 500)
  }
}
