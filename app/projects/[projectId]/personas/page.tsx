'use client'

import { useState, useEffect } from 'react'
import { useCurrentProject } from '@/lib/contexts/ProjectContext'
import { Persona } from '@/lib/types/database'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { FeaturePageLayout } from '@/components/shared/FeaturePageLayout'
import { FeatureEmptyState } from '@/components/shared/FeatureEmptyState'
import { PersonaList, PersonaFormDialog } from '@/components/features/personas'
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
import { Users, Plus, AlertTriangle, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { usePersonas, useDeletePersona } from '@/lib/hooks/use-personas'
import { TablePagination } from '@/components/ui/table-pagination'
import { usePagination } from '@/lib/hooks/use-pagination'
import { usePageState } from '@/lib/hooks/use-page-state'
import { useUserJourneyMaps } from '@/lib/hooks/use-user-journey-maps'

export default function PersonasPage() {
  const { project, isLoading: isLoadingProject } = useCurrentProject()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null)

  const router = useRouter()

  // Use page state hook with sessionStorage
  const { state: pageState, updateState } = usePageState({
    storageKey: 'personasPageState',
    defaultValues: { page: '1' },
  })

  // Use TanStack Query hooks for data fetching and mutations
  const { data: personas, isLoading, error } = usePersonas(project?.id || '')
  const { data: journeyMaps } = useUserJourneyMaps(project?.id || '')
  const deleteMutation = useDeletePersona(project?.id || '')

  // Use pagination hook with 12 items per page
  const pagination = usePagination<Persona>({
    items: personas || [],
    itemsPerPage: 12,
    initialPage: parseInt(pageState.page, 10),
  })

  // Sync pagination with page state
  useEffect(() => {
    const currentPageNum = parseInt(pageState.page, 10)
    if (pagination.currentPage !== currentPageNum) {
      updateState({ page: pagination.currentPage.toString() })
    }
  }, [pagination.currentPage])

  // Get journey maps that use the selected persona
  const affectedJourneyMaps = selectedPersona
    ? (journeyMaps || []).filter(map => map.persona_id === selectedPersona.id)
    : []

  const handleDelete = async () => {
    if (!selectedPersona) return

    deleteMutation.mutate(selectedPersona.id, {
      onSuccess: () => {
        toast.success('Persona deleted successfully!')
        setDeleteDialogOpen(false)
        setSelectedPersona(null)
      },
      onError: (error) => {
        toast.error(`Failed to delete persona: ${error.message}`)
      },
    })
  }

  const handlePersonaClick = (persona: Persona) => {
    if (!project) return
    router.push(`/projects/${project.id}/personas/${persona.id}`)
  }

  if (isLoadingProject) {
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

  return (
    <FeaturePageLayout
      title="Personas"
      description="Define user personas to guide your design decisions"
      action={
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Persona
        </Button>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-red-500">Error: {error instanceof Error ? error.message : 'Failed to load personas'}</p>
        </div>
      ) : !personas || personas.length === 0 ? (
        <FeatureEmptyState
          icon={Users}
          title="No personas yet"
          description="Create your first persona to represent your target users and guide your design decisions."
        />
      ) : (
        <div className="space-y-4">
          <PersonaList
            personas={pagination.paginatedItems}
            onView={handlePersonaClick}
            onDelete={(persona) => {
              setSelectedPersona(persona)
              setDeleteDialogOpen(true)
            }}
          />
          {pagination.totalPages > 1 && (
            <TablePagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPreviousPage={pagination.previousPage}
              onNextPage={pagination.nextPage}
              canPreviousPage={pagination.canPreviousPage}
              canNextPage={pagination.canNextPage}
            />
          )}
        </div>
      )}

      {/* Create Persona Dialog */}
      <PersonaFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        projectId={project.id}
        onSuccess={() => setCreateDialogOpen(false)}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Persona</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{selectedPersona?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Journey Map Dependencies Warning */}
          {affectedJourneyMaps.length > 0 && (
            <div className="my-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                <div className="flex-1 space-y-3">
                  <div>
                    <h4 className="font-semibold text-destructive mb-1">
                      Cascade Deletion Warning
                    </h4>
                    <p className="text-sm text-foreground/90">
                      Deleting this persona will also permanently delete the following{' '}
                      {affectedJourneyMaps.length} journey{' '}
                      {affectedJourneyMaps.length === 1 ? 'map' : 'maps'} that reference it:
                    </p>
                  </div>

                  {/* Scrollable List of Journey Maps */}
                  <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                    {affectedJourneyMaps.map((journeyMap) => (
                      <div
                        key={journeyMap.id}
                        className="flex items-center justify-between rounded-md border bg-background p-3 hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-base truncate">
                            {journeyMap.title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Created {new Date(journeyMap.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Link
                          href={`/projects/${project.id}/user-journey-maps`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-3 flex items-center gap-1 text-sm text-primary hover:underline flex-shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                'Deleting...'
              ) : affectedJourneyMaps.length > 0 ? (
                `Delete Persona & ${affectedJourneyMaps.length} Journey ${affectedJourneyMaps.length === 1 ? 'Map' : 'Maps'}`
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </FeaturePageLayout>
  )
}
