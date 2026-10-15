// File: lib/hooks/use-user-journey-maps.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  type UserJourneyMap,
  type CreateUserJourneyMapData,
  type UpdateUserJourneyMapData,
} from '@/lib/types/database'

// Helper function to fetch data from our API
const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const errorBody = await res.json()
    throw new Error(errorBody.error || 'Failed to fetch data')
  }
  return res.json()
}

// --- Query Hooks (for fetching data) ---

/**
 * Fetches all user journey maps for a specific project.
 */
export const useUserJourneyMaps = (projectId: string) => {
  const queryKey = ['userJourneyMaps', projectId]

  return useQuery<UserJourneyMap[]>({
    queryKey: queryKey,
    queryFn: () => {
      if (!projectId) {
        return Promise.resolve([])
      }
      return fetcher(`/api/projects/${projectId}/user-journey-maps`)
    },
    enabled: !!projectId,
  })
}

/**
 * Fetches a single user journey map by its ID.
 */
export const useUserJourneyMap = (projectId: string, mapId: string) => {
  const queryKey = ['userJourneyMaps', projectId, mapId]

  return useQuery<UserJourneyMap>({
    queryKey: queryKey,
    queryFn: () => {
      if (!projectId || !mapId) {
        return Promise.resolve(null as unknown as UserJourneyMap)
      }
      return fetcher(`/api/projects/${projectId}/user-journey-maps/${mapId}`)
    },
    enabled: !!projectId && !!mapId,
  })
}

// --- Mutation Hooks (for creating, updating, deleting data) ---

/**
 * Creates a new user journey map.
 */
export const useCreateUserJourneyMap = (projectId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (mapData: CreateUserJourneyMapData): Promise<UserJourneyMap> => {
      const res = await fetch(`/api/projects/${projectId}/user-journey-maps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mapData),
      })
      if (!res.ok) {
        const errorBody = await res.json()
        throw new Error(errorBody.error?.message || 'Failed to create user journey map')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userJourneyMaps', projectId] })
    },
  })
}

/**
 * Updates an existing user journey map.
 */
export const useUpdateUserJourneyMap = (projectId: string, mapId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (mapData: UpdateUserJourneyMapData): Promise<UserJourneyMap> => {
      const res = await fetch(`/api/projects/${projectId}/user-journey-maps/${mapId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mapData),
      })
      if (!res.ok) {
        const errorBody = await res.json()
        throw new Error(errorBody.error?.message || 'Failed to update user journey map')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userJourneyMaps', projectId] })
      queryClient.invalidateQueries({ queryKey: ['userJourneyMaps', projectId, mapId] })
    },
  })
}

/**
 * Deletes a user journey map.
 */
export const useDeleteUserJourneyMap = (projectId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (mapId: string) => {
      const res = await fetch(`/api/projects/${projectId}/user-journey-maps/${mapId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const errorBody = await res.json()
        throw new Error(errorBody.error?.message || 'Failed to delete user journey map')
      }
      return
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userJourneyMaps', projectId] })
    },
  })
}
