"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useCurrentProject } from "@/lib/contexts/ProjectContext";
import {
  useUserStory,
  useUpdateUserStory,
  useDeleteUserStory,
  useStoryDependencies,
} from "@/lib/hooks/use-user-stories";
import { UserStoryDetail } from "@/components/features/user-stories";
import type { UserStory } from "@/lib/types/database";
import type { UpdateUserStoryInput } from "@/lib/validations/user-story";

interface UserStoryDetailPageProps {
  params: Promise<{ projectId: string; storyId: string }>;
}

export default function UserStoryDetailPage({
  params,
}: UserStoryDetailPageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const { projectId, storyId } = resolvedParams;
  const { project, isLoading: projectLoading } = useCurrentProject();

  const {
    data: story,
    isLoading: storyLoading,
    isError,
  } = useUserStory(projectId, storyId);

  const { data: dependenciesData, isLoading: dependenciesLoading } =
    useStoryDependencies(projectId, storyId, {
      enabled: !!story,
    });

  const updateMutation = useUpdateUserStory(projectId);
  const deleteMutation = useDeleteUserStory(projectId);

  if (projectLoading || storyLoading || dependenciesLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading...</p>
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

  if (isError || !story) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">User story not found</p>
          <button
            onClick={() => router.push(`/projects/${projectId}/user-stories`)}
            className="text-primary hover:underline"
          >
            Back to User Stories
          </button>
        </div>
      </div>
    );
  }

  const handleUpdate = async (storyId: string, data: Partial<UserStory>) => {
    // Transform to UpdateUserStoryInput - only include defined fields
    const updateInput: Partial<UpdateUserStoryInput> = {};

    if (data.dependencies !== undefined) updateInput.dependencies = data.dependencies;
    if (data.title !== undefined) updateInput.title = data.title;
    if (data.user_role !== undefined) updateInput.user_role = data.user_role;
    if (data.action !== undefined) updateInput.action = data.action;
    if (data.benefit !== undefined) updateInput.benefit = data.benefit;
    if (data.acceptance_criteria !== undefined)
      updateInput.acceptance_criteria = data.acceptance_criteria || [];
    if (data.priority !== undefined && data.priority !== null) updateInput.priority = data.priority;
    if (data.status !== undefined && data.status !== null) updateInput.status = data.status;
    if (data.story_points !== undefined)
      updateInput.story_points = data.story_points;

    await updateMutation.mutateAsync({ storyId, data: updateInput });
  };

  const handleDelete = async (storyId: string) => {
    await deleteMutation.mutateAsync(storyId);
    // Navigate back to list after successful deletion
    router.push(`/projects/${projectId}/user-stories`);
  };

  return (
    <div className="w-full h-full py-4 px-2 sm:px-3 lg:px-4">
      <UserStoryDetail
        story={story}
        projectId={projectId}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        isUpdating={updateMutation.isPending}
        isDeleting={deleteMutation.isPending}
        dependenciesData={dependenciesData}
      />
    </div>
  );
}
