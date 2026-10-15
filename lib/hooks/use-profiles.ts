import { useQuery } from '@tanstack/react-query'
import type { Profile } from '@/lib/types/database'

// Query Keys
export const profileKeys = {
  all: ['profiles'] as const,
  lists: () => [...profileKeys.all, 'list'] as const,
  list: (filters: { search?: string }) => [...profileKeys.lists(), filters] as const,
}

// API Function - This will need to be implemented on the backend
async function fetchProfiles(search?: string) {
  const params = new URLSearchParams()
  if (search) {
    params.append('search', search)
  }

  const res = await fetch(`/api/profiles?${params.toString()}`)
  if (!res.ok) {
    throw new Error('Failed to fetch profiles')
  }

  return res.json() as Promise<{ data: Profile[] }>
}

// Hook
export function useProfiles(search?: string) {
  return useQuery({
    queryKey: profileKeys.list({ search }),
    queryFn: () => fetchProfiles(search),
    select: (data) => data.data || [],
  })
}
