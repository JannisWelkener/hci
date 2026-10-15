"use client"

import * as React from "react"
import { useState } from "react"
import { toast } from "sonner"

import { DialogTrigger } from "@/components/ui/dialog"
import { FeatureFormDialog } from "@/components/shared/FeatureFormDialog"
import { ProjectForm, type ProjectFormValues } from "./ProjectForm"
import { useCreateProject, useUpdateProject } from "@/lib/hooks/use-projects"
import type { Project } from "@/lib/types/database"

interface ProjectFormDialogProps {
  project?: Project | null
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: (project: Project) => void
}

export function ProjectFormDialog({
  project,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onSuccess,
}: ProjectFormDialogProps) {
  const isEditMode = !!project
  const [internalOpen, setInternalOpen] = useState(false)

  // Use controlled or uncontrolled state
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setIsOpen = controlledOnOpenChange || setInternalOpen

  // Mutations
  const createMutation = useCreateProject()
  const updateMutation = useUpdateProject()

  const handleSubmit = async (data: ProjectFormValues) => {
    if (isEditMode) {
      // Update existing project
      updateMutation.mutate(
        {
          id: project.id,
          data: {
            name: data.name,
            description: data.description,
            start_date: data.start_date,
            current_phase: data.current_phase,
            phase_status: data.phase_status,
          },
        },
        {
          onSuccess: (updatedProject) => {
            toast.success('Project updated successfully!')
            setIsOpen(false)
            onSuccess?.(updatedProject)
          },
          onError: (error) => {
            toast.error(`Failed to update project: ${error.message}`)
          },
        }
      )
    } else {
      // Create new project
      createMutation.mutate(data, {
        onSuccess: (newProject) => {
          toast.success('Project created successfully!')
          setIsOpen(false)
          onSuccess?.(newProject)
        },
        onError: (error) => {
          toast.error(`Failed to create project: ${error.message}`)
        },
      })
    }
  }

  const handleCancel = () => {
    setIsOpen(false)
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <FeatureFormDialog
      open={isOpen}
      onOpenChange={setIsOpen}
      title={isEditMode ? 'Edit Project' : 'Create New Project'}
      description={
        isEditMode
          ? 'Update your project details and track progress through the ISO 9241-210 phases.'
          : 'Create a new HCI project and start tracking your human-centered design process.'
      }
      maxWidth="3xl"
      showFooter={false}
    >
      <ProjectForm
        project={project}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isLoading}
      />
    </FeatureFormDialog>
  )
}
