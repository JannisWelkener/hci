'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/lib/hooks/useUser'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { ProjectDashboard } from '@/components/features/projects'
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
import { NotificationBell } from '@/components/notifications'
import { SettingsSheet } from '@/components/features/settings'
import { AIKeyProvider } from '@/lib/contexts/AIKeyContext'

export default function DashboardPage() {
  const router = useRouter()
  const { user, profile, loading } = useUser()
  const { data, isLoading: projectsLoading } = useProjects()
  const deleteMutation = useDeleteProject()

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Logged out successfully')
    router.push('/auth/login')
    router.refresh()
  }

  const handleCreateProject = () => {
    setSelectedProject(null)
    setCreateDialogOpen(true)
  }

  const handleEditProject = (project: Project) => {
    setSelectedProject(project)
    setEditDialogOpen(true)
  }

  const handleDeleteProject = (project: Project) => {
    setSelectedProject(project)
    setDeleteDialogOpen(true)
  }

  const handleViewProject = (project: Project) => {
    router.push(`/projects/${project.id}/dashboard`)
  }

  const confirmDelete = async () => {
    if (!selectedProject) return

    deleteMutation.mutate(selectedProject.id, {
      onSuccess: () => {
        toast.success('Project deleted successfully!')
        setDeleteDialogOpen(false)
        setSelectedProject(null)
      },
      onError: (error) => {
        toast.error(`Failed to delete project: ${error.message}`)
      },
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  if (!user || !profile) {
    return null
  }

  return (
    <AIKeyProvider>
      <div className="min-h-screen bg-background">
        <header className={`shadow-md border-b border-border bg-card`}>
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">
                  <span className="text-primary">HCI</span> Hub
              </h1>
              <p className="text-sm text-muted-foreground">
                Hello, {profile.full_name}!
              </p>
            </div>
            <div className="flex items-center gap-2">
              <SettingsSheet />
              <NotificationBell />
              <Button onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
        <ProjectDashboard
          projects={data?.projects || []}
          isLoading={projectsLoading}
          onCreateProject={handleCreateProject}
          onEditProject={handleEditProject}
          onDeleteProject={handleDeleteProject}
          onViewProject={handleViewProject}
        />

        {/* Create Project Dialog */}
        <ProjectFormDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSuccess={() => {
            setCreateDialogOpen(false)
          }}
        />

        {/* Edit Project Dialog */}
        <ProjectFormDialog
          project={selectedProject}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSuccess={() => {
            setEditDialogOpen(false)
            setSelectedProject(null)
          }}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the project &quot;{selectedProject?.name}&quot;.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteMutation.isPending}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
    </AIKeyProvider>
  )
}
