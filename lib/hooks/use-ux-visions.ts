// File: lib/hooks/use-ux-visions.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { UXVision, CreateUXVisionData, UpdateUXVisionData } from '@/lib/types/database'

// Helper function to fetch data from our API
const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const errorBody = await res.json()
    throw new Error(errorBody.error || 'Failed to fetch data')
  }
  const json = await res.json()
  return json.data
}

// --- Query Hooks (for fetching data) ---

/**
 * Fetches the UX Vision for a specific project.
 * Note: Each project should have only one UX Vision.
 */
export const useUXVision = (projectId: string) => {
  const queryKey = ['ux-vision', projectId]

  return useQuery<UXVision | null>({
    queryKey: queryKey,
    queryFn: () => {
      if (!projectId) {
        return Promise.resolve(null)
      }
      return fetcher(`/api/projects/${projectId}/ux-vision`)
    },
    enabled: !!projectId,
  })
}

// --- Mutation Hooks (for creating, updating, deleting data) ---

/**
 * Creates or updates the UX Vision for a project.
 */
export const useUpsertUXVision = (projectId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (visionData: CreateUXVisionData): Promise<UXVision> => {
      const res = await fetch(`/api/projects/${projectId}/ux-vision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(visionData),
      })
      if (!res.ok) {
        const errorBody = await res.json()
        throw new Error(errorBody.error?.message || 'Failed to save UX vision')
      }
      const json = await res.json()
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ux-vision', projectId] })
    },
  })
}

/**
 * Updates the UX Vision for a project.
 */
export const useUpdateUXVision = (projectId: string, visionId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (visionData: UpdateUXVisionData): Promise<UXVision> => {
      const res = await fetch(`/api/projects/${projectId}/ux-vision/${visionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(visionData),
      })
      if (!res.ok) {
        const errorBody = await res.json()
        throw new Error(errorBody.error?.message || 'Failed to update UX vision')
      }
      const json = await res.json()
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ux-vision', projectId] })
    },
  })
}
