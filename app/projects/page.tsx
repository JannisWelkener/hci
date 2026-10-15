'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { ProjectDashboard } from '@/components/features/projects/ProjectDashboard'
import { ProjectFormDialog } from '@/components/features/projects/ProjectFormDialog'
import { useProjects, useDeleteProject } from '@/lib/hooks/use-projects'
import type { Project } from '@/lib/types/database'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export default function ProjectsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data, isLoading } = useProjects({ limit: 1000 })
  const deleteMutation = useDeleteProject()

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [deletingProject, setDeletingProject] = useState<Project | null>(null)

  const handleCreateProject = () => {
    setIsCreateDialogOpen(true)
  }

  const handleEditProject = (project: Project) => {
    setEditingProject(project)
  }

  const handleDeleteProject = (project: Project) => {
    setDeletingProject(project)
  }

  const handleViewProject = (project: Project) => {
    // Save current state to sessionStorage before navigating
    const currentState = {
      view: searchParams.get('view') || 'grid',
      page: searchParams.get('page') || '1',
      search: searchParams.get('search') || '',
      phase: searchParams.get('phase') || 'all',
    }
    sessionStorage.setItem('projectsPageState', JSON.stringify(currentState))
    router.push(`/projects/${project.id}`)
  }

  const confirmDelete = () => {
    if (!deletingProject) return

    deleteMutation.mutate(deletingProject.id, {
      onSuccess: () => {
        toast.success('Project deleted successfully')
        setDeletingProject(null)
      },
      onError: (error) => {
        toast.error(`Failed to delete project: ${error.message}`)
      },
    })
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <ProjectDashboard
        projects={data?.projects || []}
        isLoading={isLoading}
        onCreateProject={handleCreateProject}
        onEditProject={handleEditProject}
        onDeleteProject={handleDeleteProject}
        onViewProject={handleViewProject}
      />

      {/* Create Project Dialog */}
      <ProjectFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={() => {
          setIsCreateDialogOpen(false)
        }}
      />

      {/* Edit Project Dialog */}
      <ProjectFormDialog
        project={editingProject}
        open={!!editingProject}
        onOpenChange={(open) => {
          if (!open) setEditingProject(null)
        }}
        onSuccess={() => {
          setEditingProject(null)
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingProject}
        onOpenChange={(open) => {
          if (!open) setDeletingProject(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the project &quot;{deletingProject?.name}&quot; and all
              associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
