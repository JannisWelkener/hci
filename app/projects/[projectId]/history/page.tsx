'use client'

import { useCurrentProject } from '@/lib/contexts/ProjectContext'
import { ProjectHistory } from '@/components/features/projects'

/**
 * Project History Page
 *
 * Displays a chronological history of all activity in the project.
 * Shows creations of Journey Maps, User Stories, Personas, etc. from all team members.
 */
export default function HistoryPage() {
  const { project, isLoading } = useCurrentProject()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Project not found</p>
      </div>
    )
  }

  return <ProjectHistory projectId={project.id} projectName={project.name} />
}
