'use client'
import { getSupabaseUrl } from "@/lib/env"

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Plus, Layers, Download, ExternalLink, Maximize, Minimize, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  WireframeViewer,
  WireframeList,
  WireframeFormDialog,
} from '@/components/features/wireframes'
import { useWireframes, useDeleteWireframe } from '@/lib/hooks/use-wireframes'
import { FeaturePageLayout } from '@/components/shared/FeaturePageLayout'
import { FeatureEmptyState } from '@/components/shared/FeatureEmptyState'
import { Button } from '@/components/ui/button'
import { BackButton } from '@/components/ui/back-button'
import { Wireframe } from '@/lib/types/database'
import { TablePagination } from '@/components/ui/table-pagination'
import { usePagination } from '@/lib/hooks/use-pagination'
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog'
import { useFullscreen } from '@/lib/hooks/use-fullscreen'
import { usePageState } from '@/lib/hooks/use-page-state'
import {useCurrentProject} from "@/lib/contexts/ProjectContext";

export default function ProjectWireframesPage() {
  const params = useParams()
  const projectId = params.projectId as string

  const router = useRouter()

  // State management
  const [viewingWireframe, setViewingWireframe] = useState<Wireframe | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedWireframe, setSelectedWireframe] = useState<Wireframe | null>(null)
  const viewerRef = useRef<HTMLDivElement>(null)
  const { isFullscreen, toggleFullscreen } = useFullscreen(viewerRef)

  // --- データ取得 & 削除フック ---
  const { project, isLoading: isLoadingProject } = useCurrentProject()
  const { data: wireframes, isLoading, error } = useWireframes(project?.id || '')
  const deleteMutation = useDeleteWireframe(projectId)

  // Use page state hook with sessionStorage
  const { state: pageState, updateState } = usePageState({
    storageKey: 'wireframesPageState',
    defaultValues: { page: '1' },
  })

  // Use pagination hook with 12 items per page
  const pagination = usePagination<Wireframe>({
    items: wireframes || [],
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

  // --- イベントハンドラ ---

  const handleOpenDeleteDialog = (wireframe: Wireframe) => {
    setSelectedWireframe(wireframe)
    setDeleteDialogOpen(true)
  }

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    const wireframe = wireframes?.find(w => w.id === id)
    if (wireframe) {
      handleOpenDeleteDialog(wireframe)
    }
  }

  const confirmDelete = () => {
    if (!selectedWireframe) return

    deleteMutation.mutate(selectedWireframe.id, {
      onSuccess: () => {
        toast.success('Wireframe deleted successfully!')
        setDeleteDialogOpen(false)
        setSelectedWireframe(null)
        // Close viewer if we're viewing the deleted wireframe
        if (viewingWireframe?.id === selectedWireframe.id) {
          setViewingWireframe(null)
        }
      },
      onError: (error) => {
        toast.error(`Failed to delete wireframe: ${error.message}`)
      },
    })
  }

  if (isLoadingProject) {
    return (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Loading...</p>
        </div>
    )
  }

  // --- 画面レンダリング ---

  // 1. 詳細画面 (Viewer)
  if (viewingWireframe) {
    // Helper function to get storage URL
    const getStorageUrl = (path: string) => {
      const baseUrl = getSupabaseUrl()
      if (!baseUrl) return ''
      return `${baseUrl}/storage/v1/object/public/wireframes/${path}`
    }

    const fileUrl = viewingWireframe.file_path ? getStorageUrl(viewingWireframe.file_path) : ''

    return (
      <>
        <div className="w-full h-full py-4 px-2 sm:px-3 lg:px-4">
          <div className="mb-4 px-2">
            <BackButton onClick={() => setViewingWireframe(null)} />
          </div>
          <WireframeViewer
            wireframe={viewingWireframe}
            viewerRef={viewerRef}
            actions={
              <>
                {viewingWireframe.type === 'upload' && fileUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <a
                      href={fileUrl}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </a>
                  </Button>
                )}
                {viewingWireframe.type === 'figma' && viewingWireframe.figma_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <a
                      href={viewingWireframe.figma_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open in Figma
                    </a>
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={toggleFullscreen}>
                  {isFullscreen ? (
                    <>
                      <Minimize className="h-4 w-4 mr-2" />
                      Exit Fullscreen
                    </>
                  ) : (
                    <>
                      <Maximize className="h-4 w-4 mr-2" />
                      Fullscreen
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenDeleteDialog(viewingWireframe)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </>
            }
          />
        </div>

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          itemName={selectedWireframe?.title || ''}
          itemType="wireframe"
          onConfirm={confirmDelete}
          isDeleting={deleteMutation.isPending}
        />
      </>
    )
  }

  // List view
  return (
    <FeaturePageLayout
      title="Wireframes"
      description="Manage your low-fidelity designs and sketches"
      action={
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Wireframe
        </Button>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-red-500">Error: {error instanceof Error ? error.message : 'Failed to load wireframes'}</p>
        </div>
      ) : !wireframes || wireframes.length === 0 ? (
        <FeatureEmptyState
          icon={Layers}
          title="No wireframes yet"
          description="Upload your sketches or add Figma links to start documenting your design process."
        />
      ) : (
        <div className="space-y-4">
          <WireframeList
            wireframes={pagination.paginatedItems}
            onClick={(wireframe) => setViewingWireframe(wireframe)}
            onDelete={handleDelete}
          />
          {wireframes.length > 12 && (
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

      {/* Create Wireframe Dialog */}
      <WireframeFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        projectId={projectId}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        itemName={selectedWireframe?.title || ''}
        itemType="wireframe"
        onConfirm={confirmDelete}
        isDeleting={deleteMutation.isPending}
      />
    </FeaturePageLayout>
  )
}