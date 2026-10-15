'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { FeatureFormDialog } from '@/components/shared/FeatureFormDialog'
import { UserJourneyMapForm } from './UserJourneyMapForm'
import { userStoryKeys } from '@/lib/hooks/use-user-stories'

interface UserJourneyMapFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
}

export function UserJourneyMapFormDialog({
  open,
  onOpenChange,
  projectId,
}: UserJourneyMapFormDialogProps) {
  const queryClient = useQueryClient()

  // Refetch personas and user stories when dialog opens to get latest data
  useEffect(() => {
    if (open) {
      queryClient.invalidateQueries({ queryKey: ['personas', projectId] })
      queryClient.invalidateQueries({ queryKey: userStoryKeys.lists() })
    }
  }, [open, projectId, queryClient])

  return (
    <FeatureFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Create User Journey Map"
      description="Create a new user journey map to visualize the user experience across different stages. Choose a template to get started quickly."
      showFooter={false}
      maxWidth="3xl"
    >
      <UserJourneyMapForm
        projectId={projectId}
        onSuccess={() => onOpenChange(false)}
      />
    </FeatureFormDialog>
  )
}
