"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentProject } from "@/lib/contexts/ProjectContext";
import {
  useUserStories,
  useCreateUserStory,
  useUpdateUserStory,
  useDeleteUserStory,
} from "@/lib/hooks/use-user-stories";
import type { UpdateUserStoryInput } from "@/lib/validations/user-story";
import {
  UserStoriesTable,
  UserStoryForm,
  UserStoryFormEnhanced,
  DeleteUserStoryDialog,
} from "@/components/features/user-stories";
import { FeaturePageLayout } from "@/components/shared/FeaturePageLayout";
import { FeatureFormDialog } from "@/components/shared/FeatureFormDialog";
import { FeatureEmptyState } from "@/components/shared/FeatureEmptyState";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen } from "lucide-react";
import type { UserStory } from "@/lib/types/database";

export default function UserStoriesPage() {
  const router = useRouter();
  const { project, isLoading: projectLoading } = useCurrentProject();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedStory, setSelectedStory] = useState<UserStory | null>(null);

  const { data: paginatedData, isLoading: storiesLoading } = useUserStories(
    project?.id || "",
    {
      sort: "priority_order",
      order: "asc",
    },
    {
      enabled: !!project?.id,
    }
  );

  const userStories = paginatedData?.items || [];

  const createMutation = useCreateUserStory(project?.id || "");
  const updateMutation = useUpdateUserStory(project?.id || "");
  const deleteMutation = useDeleteUserStory(project?.id || "");

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading project...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Project not found</p>
      </div>
    );
  }

  const handleCreateStory = () => {
    setShowCreateDialog(true);
  };

  const handleEditStory = (story: UserStory) => {
    setSelectedStory(story);
    setShowEditDialog(true);
  };

  const handleDeleteStory = (story: UserStory) => {
    setSelectedStory(story);
    setShowDeleteDialog(true);
  };

  const handleViewStory = (story: UserStory) => {
    router.push(`/projects/${project.id}/user-stories/${story.id}`);
  };

  const handleCreateSubmit = async (
    values: Partial<UserStory> & {
      generation_method: "manual" | "ai_generated";
    }
  ) => {
    const createInput = {
      title: values.title!,
      user_role: values.user_role!,
      action: values.action!,
      benefit: values.benefit!,
      description: values.description || null,
      acceptance_criteria: values.acceptance_criteria || [],
      priority: values.priority || "medium",
      status: values.status || "backlog",
      story_points: values.story_points || null,
      dependencies: values.dependencies || [],
      generation_method: values.generation_method,
    };
    await createMutation.mutateAsync(createInput);
    setShowCreateDialog(false);
  };

  const handleEditSubmit = async (values: Partial<UserStory>) => {
    if (!selectedStory) return;

    const updateData: UpdateUserStoryInput = {
      dependencies: values.dependencies,
      ...(values.title !== undefined && { title: values.title }),
      ...(values.user_role !== undefined && { user_role: values.user_role }),
      ...(values.action !== undefined && { action: values.action }),
      ...(values.benefit !== undefined && { benefit: values.benefit }),
      ...(values.description !== undefined && {
        description: values.description,
      }),
      ...(values.acceptance_criteria !== undefined &&
        values.acceptance_criteria !== null && {
          acceptance_criteria: values.acceptance_criteria,
        }),
      ...(values.priority !== undefined &&
        values.priority !== null && { priority: values.priority }),
      ...(values.status !== undefined &&
        values.status !== null && { status: values.status }),
      ...(values.story_points !== undefined && {
        story_points: values.story_points,
      }),
      ...(values.generation_method !== undefined && {
        generation_method: values.generation_method,
      }),
    };

    await updateMutation.mutateAsync({
      storyId: selectedStory.id,
      data: updateData,
    });
    setShowEditDialog(false);
    setSelectedStory(null);
  };

  const handleConfirmDelete = async () => {
    if (!selectedStory) return;
    await deleteMutation.mutateAsync(selectedStory.id);
    setShowDeleteDialog(false);
    setSelectedStory(null);
  };

  return (
    <FeaturePageLayout
      title="User Stories"
      description="Manage and organize your project requirements"
      action={
        <Button onClick={handleCreateStory}>
          <Plus className="mr-2 h-4 w-4" />
          Create User Story
        </Button>
      }
    >
      {storiesLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : !userStories || userStories.length === 0 ? (
        <FeatureEmptyState
          icon={BookOpen}
          title="No user stories yet"
          description="Create your first user story to define what your users need and why."
        />
      ) : (
        <UserStoriesTable
          projectId={project.id}
          stories={userStories}
          onEdit={handleEditStory}
          onDelete={handleDeleteStory}
          onView={handleViewStory}
          enableDragDrop={true}
        />
      )}

      {/* Create User Story Dialog */}
      <FeatureFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        title="Create New User Story"
        description="Add a new user story to your project. Toggle between manual entry and AI generation."
        showFooter={false}
        maxWidth="3xl"
      >
        <UserStoryFormEnhanced
          projectId={project.id}
          availableStories={userStories}
          onSubmit={handleCreateSubmit}
          isSubmitting={createMutation.isPending}
          submitLabel="Create User Story"
        />
      </FeatureFormDialog>

      {/* Edit User Story Dialog */}
      <FeatureFormDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        title="Edit User Story"
        description="Update the user story details."
        showFooter={false}
        maxWidth="3xl"
      >
        {selectedStory && (
          <UserStoryForm
            projectId={project.id}
            defaultValues={selectedStory}
            availableStories={userStories.filter(
              (s) => s.id !== selectedStory.id
            )}
            onSubmit={handleEditSubmit}
            isSubmitting={updateMutation.isPending}
            submitLabel="Update User Story"
          />
        )}
      </FeatureFormDialog>

      {/* Delete Confirmation Dialog */}
      {selectedStory && (
        <DeleteUserStoryDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          story={selectedStory}
          projectId={project.id}
          onConfirm={handleConfirmDelete}
          isDeleting={deleteMutation.isPending}
        />
      )}
    </FeaturePageLayout>
  );
}
