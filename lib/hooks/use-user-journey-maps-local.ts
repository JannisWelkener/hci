/**
 * LocalStorage-based User Journey Maps Hook
 *
 * For development without Supabase connection
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { UserJourneyMap } from '@/lib/types/database'
import type { CreateUserJourneyMapInput } from '@/lib/validations/user-journey-map'

const STORAGE_KEY = 'hci-hub-journey-maps'

/**
 * Get all journey maps from LocalStorage
 */
function getJourneyMapsFromStorage(projectId: string): UserJourneyMap[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []

    const allMaps = JSON.parse(stored) as UserJourneyMap[]
    return allMaps.filter(map => map.project_id === projectId)
  } catch (error) {
    console.error('Error reading journey maps from localStorage:', error)
    return []
  }
}

/**
 * Save journey maps to LocalStorage
 */
function saveJourneyMapsToStorage(maps: UserJourneyMap[]): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(maps))
  } catch (error) {
    console.error('Error saving journey maps to localStorage:', error)
  }
}

/**
 * Get all journey maps from LocalStorage (all projects)
 */
function getAllJourneyMapsFromStorage(): UserJourneyMap[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Error reading all journey maps from localStorage:', error)
    return []
  }
}

/**
 * Hook to fetch journey maps from LocalStorage
 */
export function useUserJourneyMapsLocal(projectId: string) {
  return useQuery({
    queryKey: ['user-journey-maps-local', projectId],
    queryFn: () => getJourneyMapsFromStorage(projectId),
    enabled: !!projectId,
  })
}

/**
 * Hook to create journey map in LocalStorage
 */
export function useCreateUserJourneyMapLocal(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateUserJourneyMapInput) => {
      // Generate ID
      const id = `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      const now = new Date().toISOString()

      const newMap: UserJourneyMap = {
        id,
        project_id: projectId,
        created_by: 'local-user',
        title: input.title,
        description: input.description ?? null,
        persona_id: input.persona_id,
        ai_optimize_timeline: input.ai_optimize_timeline,
        stages: input.stages,
        created_at: now,
        updated_at: now,
      }

      // Get all maps
      const allMaps = getAllJourneyMapsFromStorage()

      // Add new map
      allMaps.push(newMap)

      // Save back
      saveJourneyMapsToStorage(allMaps)

      return newMap
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({
        queryKey: ['user-journey-maps-local', projectId]
      })
    },
  })
}

/**
 * Hook to update journey map in LocalStorage
 */
export function useUpdateUserJourneyMapLocal(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      updates
    }: {
      id: string
      updates: Partial<CreateUserJourneyMapInput>
    }) => {
      const allMaps = getAllJourneyMapsFromStorage()
      const mapIndex = allMaps.findIndex(m => m.id === id)

      if (mapIndex === -1) {
        throw new Error('Journey map not found')
      }

      // Update map
      allMaps[mapIndex] = {
        ...allMaps[mapIndex],
        ...updates,
        updated_at: new Date().toISOString(),
      }

      // Save back
      saveJourneyMapsToStorage(allMaps)

      return allMaps[mapIndex]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['user-journey-maps-local', projectId]
      })
    },
  })
}

/**
 * Hook to delete journey map from LocalStorage
 */
export function useDeleteUserJourneyMapLocal(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const allMaps = getAllJourneyMapsFromStorage()
      const filteredMaps = allMaps.filter(m => m.id !== id)

      saveJourneyMapsToStorage(filteredMaps)

      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['user-journey-maps-local', projectId]
      })
    },
  })
}
