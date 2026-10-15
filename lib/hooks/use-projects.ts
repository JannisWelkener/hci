import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  Project,
  ProjectWithMembers,
  ApiResponse,
  PaginationMeta,
} from '@/lib/types/database'
import type { GetProjectsQuery, CreateProjectInput, UpdateProjectInput } from '@/lib/validations/project'

// Query Keys
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (filters: Partial<GetProjectsQuery>) => [...projectKeys.lists(), filters] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
  members: (id: string) => [...projectKeys.detail(id), 'members'] as const,
}

// API Functions
async function fetchProjects(params: Partial<GetProjectsQuery> = {}) {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.append(key, String(value))
    }
  })

  const res = await fetch(`/api/projects?${searchParams.toString()}`)
  if (!res.ok) {
    throw new Error('Failed to fetch projects')
  }
  const data: ApiResponse<{
    projects: Project[]
    pagination: PaginationMeta
  }> = await res.json()

  if (data.error) {
    throw new Error(data.error.message)
  }

  return data.data!
}

async function fetchProject(id: string, includeMembers = false) {
  const params = includeMembers ? '?include=members' : ''
  const res = await fetch(`/api/projects/${id}${params}`)
  if (!res.ok) {
    throw new Error('Failed to fetch project')
  }
  const data: ApiResponse<Project | ProjectWithMembers> = await res.json()

  if (data.error) {
    throw new Error(data.error.message)
  }

  return data.data!
}

async function createProject(input: CreateProjectInput) {
  const res = await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!res.ok) {
    throw new Error('Failed to create project')
  }

  const data: ApiResponse<Project> = await res.json()

  if (data.error) {
    throw new Error(data.error.message)
  }

  return data.data!
}

async function updateProject(id: string, input: UpdateProjectInput) {
  const res = await fetch(`/api/projects/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!res.ok) {
    throw new Error('Failed to update project')
  }

  const data: ApiResponse<Project> = await res.json()

  if (data.error) {
    throw new Error(data.error.message)
  }

  return data.data!
}

async function deleteProject(id: string) {
  const res = await fetch(`/api/projects/${id}`, {
    method: 'DELETE',
  })

  if (!res.ok) {
    throw new Error('Failed to delete project')
  }

  const data: ApiResponse<{ success: boolean; id: string }> = await res.json()

  if (data.error) {
    throw new Error(data.error.message)
  }

  return data.data!
}

// Hooks
export function useProjects(filters: Partial<GetProjectsQuery> = {}) {
  return useQuery({
    queryKey: projectKeys.list(filters),
    queryFn: () => fetchProjects(filters),
  })
}

export function useProject(id: string, includeMembers = false) {
  return useQuery({
    queryKey: includeMembers ? projectKeys.members(id) : projectKeys.detail(id),
    queryFn: () => fetchProject(id, includeMembers),
    enabled: !!id,
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      // Invalidate and refetch project lists
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
    },
  })
}

export function useUpdateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectInput }) =>
      updateProject(id, data),
    onSuccess: (data, variables) => {
      // Update the specific project in cache
      queryClient.setQueryData(projectKeys.detail(variables.id), data)
      // Invalidate lists to reflect changes
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteProject,
    onSuccess: (data) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: projectKeys.detail(data.id) })
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
    },
  })
}
