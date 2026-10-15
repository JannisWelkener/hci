'use client'

import { useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { BackButton } from '@/components/ui/back-button'
import { Button } from '@/components/ui/button'
import { UserJourneyMapVisualEditable } from '@/components/features/user-journey-maps'
import { PDFExportButton } from '@/components/features/user-journey-maps/PDFExportButton'
import { useUserJourneyMaps, useDeleteUserJourneyMap } from '@/lib/hooks/use-user-journey-maps'
import { usePersonas } from '@/lib/hooks/use-personas'
import { useUserStories } from '@/lib/hooks/use-user-stories'
import { UserJourneyMap, UserJourneyMapWithTimeline } from '@/lib/types/database'
import { Trash2, Edit2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog'

export default function UserJourneyMapDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string
  const journeyMapId = params.journeyMapId as string
  const [currentJourneyMap, setCurrentJourneyMap] = useState<UserJourneyMap | null>(null)

  // NEW: track whether the editable view is in edit mode
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Fetch data
  const { data: journeyMaps, isLoading, error } = useUserJourneyMaps(projectId)
  const { data: personas = [] } = usePersonas(projectId)
  const { data: userStoriesData } = useUserStories(projectId)
  const deleteMutation = useDeleteUserJourneyMap(projectId)

  // Find the selected journey map
  const selectedMap = journeyMaps?.find(map => map.id === journeyMapId)

  // Get the persona for the selected journey map
  const activeMap = currentJourneyMap || selectedMap
  const persona = useMemo(() => {
    if (!activeMap) return null
    return personas.find(p => p.id === activeMap.persona_id) || null
  }, [activeMap, personas])

  // Get user stories from timeline
  const timelineUserStories = useMemo(() => {
    if (!activeMap) return []
    const userStories = userStoriesData?.items ?? []
    const journeyMapWithTimeline = activeMap as UserJourneyMapWithTimeline
    if (!journeyMapWithTimeline.timeline || journeyMapWithTimeline.timeline.length === 0) {
      return []
    }
    const sortedTimeline = [...journeyMapWithTimeline.timeline].sort((a, b) => a.position - b.position)
    return sortedTimeline
      .map(entry => userStories.find(story => story.id === entry.user_story_id))
      .filter(Boolean) as typeof userStories
  }, [activeMap, userStoriesData?.items])

  // Handle delete
  const handleDelete = async () => {
    if (!selectedMap) return

    deleteMutation.mutate(journeyMapId, {
      onSuccess: () => {
        toast.success('Journey map deleted successfully!')
        router.push(`/projects/${projectId}/user-journey-maps`)
      },
      onError: (error) => {
        toast.error(`Failed to delete journey map: ${error.message}`)
      },
    })
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <BackButton />
        </div>
        <div className="flex items-center justify-center py-12">
          <p className="text-red-500">Error: {error instanceof Error ? error.message : 'Failed to load journey map'}</p>
        </div>
      </div>
    )
  }

  if (!selectedMap) {
    return (
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <BackButton />
        </div>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Journey map not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full py-4 px-2 sm:px-3 lg:px-4">
      <div className="mb-4 px-2">
        <div className={isEditing ? 'invisible pointer-events-none' : ''}>
          <BackButton />
        </div>
      </div>
      <UserJourneyMapVisualEditable
        journeyMap={selectedMap}
        projectId={projectId}
        onSaveComplete={() => {
          // Optionally refresh or show success message
        }}
        onJourneyMapChange={(updatedMap) => setCurrentJourneyMap(updatedMap)}
        onEditingChange={(editing) => setIsEditing(editing)}
        isEditing={isEditing}
        hideTopEditButton={true}
        actions={
          !isEditing && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
              {(currentJourneyMap || selectedMap) && (
                <PDFExportButton
                  journeyMap={currentJourneyMap || selectedMap}
                  persona={persona}
                  userStories={timelineUserStories}
                />
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </>
          )
        }
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        itemName={selectedMap?.title || ''}
        itemType="journey map"
        onConfirm={handleDelete}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  )
}
