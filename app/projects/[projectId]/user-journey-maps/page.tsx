'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import {
  UserJourneyMapList,
  UserJourneyMapFormDialog,
} from '@/components/features/user-journey-maps'
import { FeaturePageLayout } from '@/components/shared/FeaturePageLayout'
import { useParams } from 'next/navigation'
import { useUserJourneyMaps } from '@/lib/hooks/use-user-journey-maps'
import { FeatureEmptyState } from '@/components/shared/FeatureEmptyState'
import { Map } from 'lucide-react'
import { TablePagination } from '@/components/ui/table-pagination'
import { useCurrentProject } from "@/lib/contexts/ProjectContext"
import { usePagination } from '@/lib/hooks/use-pagination'
import { usePageState } from '@/lib/hooks/use-page-state'
import { UserJourneyMap } from '@/lib/types/database'

export default function UserJourneyMapsPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const { project, isLoading: isLoadingProject } = useCurrentProject()
  const { data: journeyMaps, isLoading, error } = useUserJourneyMaps(project?.id || '')

  // Use page state hook with sessionStorage
  const { state: pageState, updateState } = usePageState({
    storageKey: 'journeyMapsPageState',
    defaultValues: { page: '1' },
  })

  // Use pagination hook with 12 items per page
  const pagination = usePagination<UserJourneyMap>({
    items: journeyMaps || [],
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

  if (isLoadingProject) {
    return (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Loading...</p>
        </div>
    )
  }

  return (
    <FeaturePageLayout
      title="User Journey Maps"
      description="Visualize user experiences across different touchpoints and stages"
      action={
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Journey Map
        </Button>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-red-500">Error: {error instanceof Error ? error.message : 'Failed to load journey maps'}</p>
        </div>
      ) : !journeyMaps || journeyMaps.length === 0 ? (
        <FeatureEmptyState
          icon={Map}
          title="No journey maps yet"
          description="Create your first user journey map to visualize user experiences across different touchpoints and stages."
        />
      ) : (
        <div className="space-y-4">
          <UserJourneyMapList
            journeyMaps={pagination.paginatedItems}
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

      {/* Create Dialog */}
      <UserJourneyMapFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        projectId={projectId}
      />
    </FeaturePageLayout>
  )
}
