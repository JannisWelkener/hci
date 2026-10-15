import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectKeys } from './use-projects'
import type {
  ApiResponse,
  ProjectInvitation,
  ProjectInvitationWithInviter,
  InvitationStatus,
  MemberRole,
} from '@/lib/types/database'

// Query Keys
export const invitationKeys = {
  all: ['invitations'] as const,
  lists: () => [...invitationKeys.all, 'list'] as const,
  list: (projectId: string, status?: InvitationStatus) =>
    [...invitationKeys.lists(), projectId, status] as const,
  details: () => [...invitationKeys.all, 'detail'] as const,
  detail: (token: string) => [...invitationKeys.details(), token] as const,
}

// API Functions

/**
 * Fetch all invitations for a project
 */
async function fetchProjectInvitations(projectId: string, status?: InvitationStatus) {
  const params = status ? `?status=${status}` : ''
  const res = await fetch(`/api/projects/${projectId}/invitations${params}`)

  if (!res.ok) {
    throw new Error('Failed to fetch project invitations')
  }

  const data: ApiResponse<{ invitations: ProjectInvitationWithInviter[] }> = await res.json()

  if (data.error) {
    throw new Error(data.error.message)
  }

  return data.data!.invitations
}

/**
 * Create and send a project invitation
 */
async function createInvitation(params: {
  projectId: string
  email: string
  role?: MemberRole
  message?: string
}) {
  const { projectId, email, role = 'member', message } = params

  const res = await fetch(`/api/projects/${projectId}/invitations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, role, message }),
  })

  if (!res.ok) {
    const errorData: ApiResponse<null> = await res.json()
    throw new Error(errorData.error?.message || 'Failed to create invitation')
  }

  const data: ApiResponse<{ invitation: ProjectInvitation }> = await res.json()

  if (data.error) {
    throw new Error(data.error.message)
  }

  return data.data!.invitation
}

/**
 * Revoke a project invitation
 */
async function revokeInvitation(params: { projectId: string; invitationId: string }) {
  const { projectId, invitationId } = params

  const res = await fetch(`/api/projects/${projectId}/invitations/${invitationId}`, {
    method: 'DELETE',
  })

  if (!res.ok) {
    const errorData: ApiResponse<null> = await res.json()
    throw new Error(errorData.error?.message || 'Failed to revoke invitation')
  }

  const data: ApiResponse<{ message: string }> = await res.json()

  if (data.error) {
    throw new Error(data.error.message)
  }

  return data.data!
}

/**
 * Get invitation details by token
 */
async function fetchInvitationByToken(token: string) {
  const res = await fetch(`/api/invitations/${token}`)

  if (!res.ok) {
    const errorData: ApiResponse<null> = await res.json()
    throw new Error(errorData.error?.message || 'Failed to fetch invitation')
  }

  const data: ApiResponse<{ invitation: ProjectInvitationWithInviter & { is_expired: boolean; project: { id: string; name: string; description: string | null }; inviter: { id: string; full_name: string; email: string } } }> = await res.json()

  if (data.error) {
    throw new Error(data.error.message)
  }

  return data.data!.invitation
}

/**
 * Accept a project invitation
 */
async function acceptInvitation(token: string) {
  const res = await fetch(`/api/invitations/${token}/accept`, {
    method: 'POST',
  })

  if (!res.ok) {
    const errorData: ApiResponse<null> = await res.json()
    throw new Error(errorData.error?.message || 'Failed to accept invitation')
  }

  const data: ApiResponse<{
    message: string
    project_id: string
    project_name: string
    already_member?: boolean
  }> = await res.json()

  if (data.error) {
    throw new Error(data.error.message)
  }

  return data.data!
}

/**
 * Decline a project invitation
 */
async function declineInvitation(token: string) {
  const res = await fetch(`/api/invitations/${token}/decline`, {
    method: 'POST',
  })

  if (!res.ok) {
    const errorData: ApiResponse<null> = await res.json()
    throw new Error(errorData.error?.message || 'Failed to decline invitation')
  }

  const data: ApiResponse<{ message: string }> = await res.json()

  if (data.error) {
    throw new Error(data.error.message)
  }

  return data.data!
}

// Hooks

/**
 * Query hook to fetch project invitations
 * @param projectId - Project ID
 * @param status - Optional status filter
 */
export function useProjectInvitations(projectId: string, status?: InvitationStatus) {
  return useQuery({
    queryKey: invitationKeys.list(projectId, status),
    queryFn: () => fetchProjectInvitations(projectId, status),
    enabled: !!projectId,
  })
}

/**
 * Mutation hook to create and send an invitation
 */
export function useCreateInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createInvitation,
    onSuccess: (data, variables) => {
      // Invalidate invitations list for this project
      queryClient.invalidateQueries({
        queryKey: invitationKeys.lists(),
      })
      // Also invalidate specific project invitations
      queryClient.invalidateQueries({
        queryKey: invitationKeys.list(variables.projectId),
      })
    },
  })
}

/**
 * Mutation hook to revoke an invitation
 */
export function useRevokeInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: revokeInvitation,
    onSuccess: (data, variables) => {
      // Invalidate invitations list
      queryClient.invalidateQueries({
        queryKey: invitationKeys.lists(),
      })
      // Also invalidate specific project invitations
      queryClient.invalidateQueries({
        queryKey: invitationKeys.list(variables.projectId),
      })
    },
  })
}

/**
 * Query hook to fetch invitation details by token (for acceptance page)
 * @param token - Invitation token
 */
export function useInvitationDetails(token: string) {
  return useQuery({
    queryKey: invitationKeys.detail(token),
    queryFn: () => fetchInvitationByToken(token),
    enabled: !!token,
    retry: false, // Don't retry on error (token might be invalid)
  })
}

/**
 * Mutation hook to accept an invitation
 */
export function useAcceptInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: acceptInvitation,
    onSuccess: (data, token) => {
      // Invalidate the invitation detail
      queryClient.invalidateQueries({
        queryKey: invitationKeys.detail(token),
      })
      // Invalidate project members (user just joined)
      if (data.project_id) {
        queryClient.invalidateQueries({
          queryKey: projectKeys.members(data.project_id),
        })
        // Invalidate projects list (user now has access to this project)
        queryClient.invalidateQueries({
          queryKey: projectKeys.lists(),
        })
      }
    },
  })
}

/**
 * Mutation hook to decline an invitation
 */
export function useDeclineInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: declineInvitation,
    onSuccess: (data, token) => {
      // Invalidate the invitation detail
      queryClient.invalidateQueries({
        queryKey: invitationKeys.detail(token),
      })
    },
  })
}
