'use client'

import { FeatureFormDialog } from '@/components/shared/FeatureFormDialog'
import { WireframeForm } from './WireframeForm'

interface WireframeFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  onSuccess?: () => void
}

export function WireframeFormDialog({
  open,
  onOpenChange,
  projectId,
  onSuccess,
}: WireframeFormDialogProps) {
  const handleSuccess = () => {
    onSuccess?.()
    onOpenChange(false)
  }

  return (
    <FeatureFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Create New Wireframe"
      description="Upload your sketches or add Figma links to document your design process."
      showFooter={false}
      maxWidth="3xl"
    >
      <WireframeForm
        projectId={projectId}
        onSuccess={handleSuccess}
        onCancel={() => onOpenChange(false)}
      />
    </FeatureFormDialog>
  )
}
