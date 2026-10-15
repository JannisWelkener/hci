// File: lib/hooks/use-personas.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Persona } from '@/lib/types/database'
import { isMockMode } from '@/lib/config/environment'
import { mockPersonas } from '@/lib/mocks/user-journey-data'

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
 * Fetches all personas for a specific project.
 * Uses mock data when API_MODE is 'mock', otherwise fetches from API.
 */
export const usePersonas = (projectId: string) => {
  const queryKey = ['personas', projectId]

  return useQuery<Persona[]>({
    queryKey: queryKey,
    queryFn: () => {
      if (!projectId) {
        return Promise.resolve([])
      }

      // Use mock data in mock mode
      if (isMockMode()) {
        return Promise.resolve(mockPersonas)
      }

      // Use production API in production mode
      return fetcher(`/api/projects/${projectId}/personas`)
    },
    enabled: !!projectId,
  })
}

/**
 * Fetches a single persona by its ID.
 */
export const usePersona = (projectId: string, personaId: string) => {
  const queryKey = ['personas', projectId, personaId]

  return useQuery<Persona>({
    queryKey: queryKey,
    queryFn: () => {
      if (!projectId || !personaId) {
        return Promise.resolve(null as unknown as Persona)
      }
      return fetcher(`/api/projects/${projectId}/personas/${personaId}`)
    },
    enabled: !!projectId && !!personaId,
  })
}

// --- Mutation Hooks (for creating, updating, deleting data) ---

export type CreatePersonaData = Omit<Persona, 'id' | 'project_id' | 'created_at' | 'updated_at' | 'created_by'>
export type UpdatePersonaData = Partial<CreatePersonaData>

/**
 * Creates a new persona.
 */
export const useCreatePersona = (projectId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (personaData: CreatePersonaData): Promise<Persona> => {
      const res = await fetch(`/api/projects/${projectId}/personas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(personaData),
      })
      if (!res.ok) {
        const errorBody = await res.json()
        throw new Error(errorBody.error?.message || 'Failed to create persona')
      }
      const json = await res.json()
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personas', projectId] })
    },
  })
}

/**
 * Updates an existing persona.
 */
export const useUpdatePersona = (projectId: string, personaId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (personaData: UpdatePersonaData): Promise<Persona> => {
      const res = await fetch(`/api/projects/${projectId}/personas/${personaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(personaData),
      })
      if (!res.ok) {
        const errorBody = await res.json()
        throw new Error(errorBody.error?.message || 'Failed to update persona')
      }
      const json = await res.json()
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personas', projectId] })
      queryClient.invalidateQueries({ queryKey: ['personas', projectId, personaId] })
    },
  })
}

/**
 * Deletes a persona.
 */
export const useDeletePersona = (projectId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (personaId: string) => {
      const res = await fetch(`/api/projects/${projectId}/personas/${personaId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const errorBody = await res.json()
        throw new Error(errorBody.error?.message || 'Failed to delete persona')
      }
      return
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personas', projectId] })
      // Invalidate journey maps cache since persona deletion cascades to journey maps
      queryClient.invalidateQueries({ queryKey: ['userJourneyMaps', projectId] })
    },
  })
}
