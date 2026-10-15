'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { Plus, Layers, ExternalLink, Maximize, Minimize, Trash2 } from 'lucide-react';
import {
  useMockups,
  useDeleteMockup,
} from '@/lib/hooks/use-mockups';
import {
  MockupFormDialog,
  MockupViewer,
  MockupList,
} from '@/components/features/mockups';
import { FeaturePageLayout } from '@/components/shared/FeaturePageLayout';
import { FeatureEmptyState } from '@/components/shared/FeatureEmptyState';
import type { Mockup } from '@/lib/types/database';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import { TablePagination } from '@/components/ui/table-pagination';
import { usePagination } from '@/lib/hooks/use-pagination';
import { useFullscreen } from '@/lib/hooks/use-fullscreen';
import { useCurrentProject } from "@/lib/contexts/ProjectContext";
import { usePageState } from '@/lib/hooks/use-page-state';

// --- 修正版ページコンポーネント ---
export default function MockupsPage({
  params,
}: {
  params: Promise<{ projectId: string }>; // ← Promise型にする
}) {
  // ✅ React.use() で Promise を解決
  const { projectId } = React.use(params);

  const router = useRouter();

  // --- (1) State Management ---
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMockup, setSelectedMockup] = useState<Mockup | null>(null);
  const [viewingMockup, setViewingMockup] = useState<Mockup | null>(null);
  const viewerRef = React.useRef<HTMLDivElement>(null);
  const { isFullscreen, toggleFullscreen } = useFullscreen(viewerRef);

  // --- (2) Data Fetching & Mutations ---
  const { project, isLoading: isLoadingProject } = useCurrentProject()
  const { data: mockups, isLoading, error } = useMockups(project?.id || '');
  const deleteMutation = useDeleteMockup(projectId);

  // Use page state hook with sessionStorage
  const { state: pageState, updateState } = usePageState({
    storageKey: 'mockupsPageState',
    defaultValues: { page: '1' },
  });

  // Use pagination hook with 12 items per page
  const pagination = usePagination<Mockup>({
    items: mockups || [],
    itemsPerPage: 12,
    initialPage: parseInt(pageState.page, 10),
  });

  // Sync pagination with page state
  useEffect(() => {
    const currentPageNum = parseInt(pageState.page, 10)
    if (pagination.currentPage !== currentPageNum) {
      updateState({ page: pagination.currentPage.toString() })
    }
  }, [pagination.currentPage]);

  // --- (3) Event Handlers ---
  const handleOpenCreateDialog = () => {
    setSelectedMockup(null);
    setCreateDialogOpen(true);
  };

  const handleOpenEditDialog = (mockup: Mockup) => {
    setSelectedMockup(mockup);
    setEditDialogOpen(true);
  };

  const handleOpenDeleteDialog = (mockup: Mockup) => {
    setSelectedMockup(mockup);
    setDeleteDialogOpen(true);
  };

  const handleViewMockup = (mockup: Mockup) => {
    setViewingMockup(mockup);
  };

  const handleCloseViewer = () => {
    setViewingMockup(null);
  };

  const confirmDelete = async () => {
    if (!selectedMockup) return;

    deleteMutation.mutate(selectedMockup.id, {
      onSuccess: () => {
        toast.success('Mockup deleted successfully!');
        setDeleteDialogOpen(false);
        setSelectedMockup(null);
        // Close viewer if we're viewing the deleted mockup
        if (viewingMockup?.id === selectedMockup.id) {
          setViewingMockup(null);
        }
      },
      onError: (error) => {
        toast.error(`Failed to delete mockup: ${error.message}`);
      },
    });
  };

  if (isLoadingProject) {
    return (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Loading...</p>
        </div>
    )
  }
  // --- (4) JSX ---
  if (viewingMockup) {
    return (
      <>
        <div className="w-full h-full py-4 px-2 sm:px-3 lg:px-4">
          <div className="mb-4 px-2">
            <BackButton onClick={handleCloseViewer} />
          </div>
          <MockupViewer
            mockup={viewingMockup}
            viewerRef={viewerRef}
            actions={
              <>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <a href={viewingMockup.figma_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in Figma
                  </a>
                </Button>
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
                  onClick={() => handleOpenDeleteDialog(viewingMockup)}
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
          itemName={selectedMockup?.title || ''}
          itemType="mockup"
          onConfirm={confirmDelete}
          isDeleting={deleteMutation.isPending}
        />
      </>
    );
  }

  return (
    <FeaturePageLayout
      title="Mockups"
      description="Manage high-fidelity designs and prototypes"
      action={
        <Button onClick={handleOpenCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Create Mockup
        </Button>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-red-500">Error: {error instanceof Error ? error.message : 'Failed to load mockups'}</p>
        </div>
      ) : !mockups || mockups.length === 0 ? (
        <FeatureEmptyState
          icon={Layers}
          title="No mockups yet"
          description="Get started by adding your first Figma mockup to document your design progress."
        />
      ) : (
        <div className="space-y-4">
          <MockupList
            mockups={pagination.paginatedItems}
            onView={handleViewMockup}
            onEdit={handleOpenEditDialog}
            onDelete={handleOpenDeleteDialog}
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

      {/* Dialogs */}
      <MockupFormDialog
        projectId={projectId}
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => setCreateDialogOpen(false)}
      />

      <MockupFormDialog
        projectId={projectId}
        mockup={selectedMockup}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={() => {
          setEditDialogOpen(false);
          setSelectedMockup(null);
        }}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        itemName={selectedMockup?.title || ''}
        itemType="mockup"
        onConfirm={confirmDelete}
        isDeleting={deleteMutation.isPending}
      />
    </FeaturePageLayout>
  );
}
