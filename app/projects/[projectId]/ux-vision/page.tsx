'use client'

import { useEffect, useState } from 'react'
import { useCurrentProject } from '@/lib/contexts/ProjectContext'
import { useUXVision, useUpsertUXVision } from '@/lib/hooks/use-ux-visions'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2, Pencil, Save, X } from 'lucide-react'

export default function UXVisionPage() {
  const { project, isLoading: isLoadingProject } = useCurrentProject()
  const { data: visionData, isLoading, error } = useUXVision(project?.id || '')
  const upsertMutation = useUpsertUXVision(project?.id || '')

  const [vision, setVision] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  // Initialize vision text when data loads
  useEffect(() => {
    if (visionData) {
      setVision(visionData.vision)
      setIsEditing(false)
    } else {
      // No vision exists yet, start in edit mode
      setIsEditing(true)
    }
  }, [visionData])

  const handleSave = async () => {
    if (!vision.trim()) {
      toast.error('Please enter a UX vision')
      return
    }

    try {
      await upsertMutation.mutateAsync({ vision: vision.trim() })
      toast.success(visionData ? 'UX vision updated' : 'UX vision created')
      setIsEditing(false)
    } catch (error) {
      toast.error('Failed to save UX vision')
      console.error('Error saving UX vision:', error)
    }
  }

  const handleCancel = () => {
    if (visionData) {
      setVision(visionData.vision)
      setIsEditing(false)
    }
  }

  if (isLoadingProject || isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-destructive">Failed to load UX vision</p>
      </div>
    )
  }

  return (
    <div className="w-full px-24 py-12">
      {isEditing ? (
        // Edit mode - show textarea and save/cancel buttons
        <div className="space-y-4">
          <Textarea
            value={vision}
            onChange={(e) => setVision(e.target.value)}
            placeholder="Enter your UX vision here..."
            className="min-h-[300px] text-2xl leading-relaxed resize-none border-2 p-6 text-center"
            autoFocus
          />
          <div className="flex gap-2 justify-center">
            {visionData && (
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={upsertMutation.isPending}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={upsertMutation.isPending || !vision.trim()}
            >
              {upsertMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        // Display mode - show vision in big letters with edit button
        <div className="relative flex items-center justify-center min-h-[60vh]">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-0 right-0"
            onClick={() => setIsEditing(true)}
          >
            <Pencil className="h-5 w-5" />
          </Button>
          <p className="text-6xl font-bold leading-tight text-center uppercase">
            {vision}
          </p>
        </div>
      )}
    </div>
  )
}
