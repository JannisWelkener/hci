import { useMutation, useQueryClient } from '@tanstack/react-query'
import { projectKeys } from './use-projects'
import type { ApiResponse, Project, IsoPhase, PhaseStatusValue } from '@/lib/types/database'

// API Function
async function updateProjectPhase(
  projectId: string,
  phase: IsoPhase,
  status: PhaseStatusValue
) {
  const res = await fetch(`/api/projects/${projectId}/phases`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phase, status }),
  })

  if (!res.ok) {
    throw new Error('Failed to update project phase')
  }

  const data: ApiResponse<Project> = await res.json()

  if (data.error) {
    throw new Error(data.error.message)
  }

  return data.data!
}

// Hook
export function useUpdateProjectPhase() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      projectId,
      phase,
      status,
    }: {
      projectId: string
      phase: IsoPhase
      status: PhaseStatusValue
    }) => updateProjectPhase(projectId, phase, status),
    onMutate: async ({ projectId, phase, status }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: projectKeys.detail(projectId) })

      // Snapshot previous value
      const previousProject = queryClient.getQueryData<Project>(projectKeys.detail(projectId))

      // Optimistically update
      if (previousProject) {
        queryClient.setQueryData<Project>(projectKeys.detail(projectId), {
          ...previousProject,
          phase_status: {
            ...previousProject.phase_status,
            [phase]: status,
          },
          current_phase: status === 'in_progress' ? phase : previousProject.current_phase,
        })
      }

      return { previousProject }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousProject) {
        queryClient.setQueryData(
          projectKeys.detail(variables.projectId),
          context.previousProject
        )
      }
    },
    onSuccess: (data, variables) => {
      // Update cache with server response
      queryClient.setQueryData(projectKeys.detail(variables.projectId), data)
      // Invalidate lists to reflect changes
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
    },
  })
}
