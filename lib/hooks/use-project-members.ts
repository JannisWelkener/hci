import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectKeys } from './use-projects'
import type { ApiResponse, ProjectMemberWithProfile, MemberRole } from '@/lib/types/database'

// API Functions
async function fetchProjectMembers(projectId: string) {
  const res = await fetch(`/api/projects/${projectId}/members`)
  if (!res.ok) {
    throw new Error('Failed to fetch project members')
  }
  const data: ApiResponse<{ members: ProjectMemberWithProfile[] }> = await res.json()

  if (data.error) {
    throw new Error(data.error.message)
  }

  return data.data!.members
}

async function addProjectMember(projectId: string, userId: string, role: MemberRole = 'member') {
  const res = await fetch(`/api/projects/${projectId}/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, role }),
  })

  if (!res.ok) {
    throw new Error('Failed to add project member')
  }

  const data: ApiResponse<ProjectMemberWithProfile> = await res.json()

  if (data.error) {
    throw new Error(data.error.message)
  }

  return data.data!
}

async function removeProjectMember(projectId: string, userId: string) {
  const res = await fetch(`/api/projects/${projectId}/members/${userId}`, {
    method: 'DELETE',
  })

  if (!res.ok) {
    throw new Error('Failed to remove project member')
  }

  const data: ApiResponse<{ success: boolean; user_id: string }> = await res.json()

  if (data.error) {
    throw new Error(data.error.message)
  }

  return data.data!
}

// Hooks
export function useProjectMembers(projectId: string) {
  return useQuery({
    queryKey: projectKeys.members(projectId),
    queryFn: () => fetchProjectMembers(projectId),
    enabled: !!projectId,
  })
}

export function useAddProjectMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ projectId, userId, role }: { projectId: string; userId: string; role?: MemberRole }) =>
      addProjectMember(projectId, userId, role),
    onSuccess: (data, variables) => {
      // Invalidate members list
      queryClient.invalidateQueries({ queryKey: projectKeys.members(variables.projectId) })
      // Also invalidate project detail if it includes members
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.projectId) })
    },
  })
}

export function useRemoveProjectMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ projectId, userId }: { projectId: string; userId: string }) =>
      removeProjectMember(projectId, userId),
    onSuccess: (data, variables) => {
      // Invalidate members list
      queryClient.invalidateQueries({ queryKey: projectKeys.members(variables.projectId) })
      // Also invalidate project detail if it includes members
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.projectId) })
    },
  })
}
