'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { Project } from '@/lib/types/database'
import { useProject as useFetchProject } from '@/lib/hooks/use-projects'

interface ProjectContextValue {
  projectId: string | null
  project: Project | null
  isLoading: boolean
  error: Error | null
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined)

interface ProjectProviderProps {
  projectId: string
  children: ReactNode
}

export function ProjectProvider({ projectId, children }: ProjectProviderProps) {
  const { data: project, isLoading, error } = useFetchProject(projectId)

  const value: ProjectContextValue = {
    projectId,
    project: project || null,
    isLoading,
    error: error as Error | null,
  }

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  )
}

/**
 * Hook to access the current project context
 * Must be used within a ProjectProvider
 */
export function useCurrentProject() {
  const context = useContext(ProjectContext)

  if (context === undefined) {
    throw new Error('useCurrentProject must be used within a ProjectProvider')
  }

  return context
}
