"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Edit, Trash2, Target, Calendar } from "lucide-react";
import { format } from "date-fns";
import type { UserStory } from "@/lib/types/database";
import { UserStoryForm } from "./UserStoryForm";
import { DependencyList } from "./DependencyList";
import { BackButton } from "@/components/ui/back-button";
import { useUserStories } from "@/lib/hooks/use-user-stories";
import { DeleteUserStoryDialog } from "./DeleteUserStoryDialog";
import { cn } from "@/lib/utils";
import {
  getPriorityColor,
  getStatusColor,
  formatPriority,
  formatStatus,
  BADGE_SIZE_CLASS,
} from "@/lib/utils/badge-styles";

interface UserStoryDetailProps {
  story: UserStory;
  projectId: string;
  onUpdate?: (
    storyId: string,
    data: Partial<UserStory>
  ) => void | Promise<void>;
  onDelete?: (storyId: string) => void | Promise<void>;
  isUpdating?: boolean;
  isDeleting?: boolean;
  dependenciesData?: {
    story: UserStory;
    outgoing: UserStory[];
    incoming: UserStory[];
  };
}

export function UserStoryDetail({
  story,
  projectId,
  onUpdate,
  onDelete,
  isUpdating = false,
  isDeleting = false,
  dependenciesData,
}: UserStoryDetailProps) {
  const router = useRouter();
  const [isEditMode, setIsEditMode] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch available stories for dependency selector
  const { data: storiesData } = useUserStories(projectId);
  const availableStories = storiesData?.items || [];

  const handleBack = () => {
    router.push(`/projects/${projectId}/user-stories`);
  };

  const handleEdit = () => {
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
  };

  const handleUpdate = async (values: Partial<UserStory>) => {
    if (onUpdate) {
      await onUpdate(story.id, values);
      setIsEditMode(false);
    }
  };

  const handleDelete = async () => {
    if (onDelete) {
      await onDelete(story.id);
      setShowDeleteDialog(false);
      // Navigation will be handled by parent component after successful delete
    }
  };

  const handleDependencyClick = (storyId: string) => {
    router.push(`/projects/${projectId}/user-stories/${storyId}`);
  };

  if (isEditMode) {
    return (
      <div className="space-y-6">
        {/* Header */}

        <Card>
          <CardHeader>
            <CardTitle>Edit User Story</CardTitle>
            <CardDescription>
              Update the user story details below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UserStoryForm
              projectId={projectId}
              defaultValues={story}
              availableStories={availableStories}
              onSubmit={handleUpdate}
              isSubmitting={isUpdating}
              submitLabel="Save Changes"
            />
            <div className="-mt-8">
              <Button
                variant="outline"
                onClick={handleCancelEdit}
                disabled={isUpdating}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div>
        <BackButton onClick={handleBack} />
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-2xl">{story.title}</CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  variant="outline"
                  className={cn(
                    BADGE_SIZE_CLASS,
                    getPriorityColor(story.priority || "medium")
                  )}
                >
                  {formatPriority(story.priority || "medium")}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn(
                    BADGE_SIZE_CLASS,
                    getStatusColor(story.status || "backlog")
                  )}
                >
                  {formatStatus(story.status || "backlog")}
                </Badge>
              </div>
            </div>

            {/* Action Buttons and Story Points */}
            <div className="flex items-center gap-2 shrink-0">
              {onUpdate && (
                <Button variant="outline" size="sm" onClick={handleEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
              {story.story_points && (
                <div className="flex-shrink-0 flex flex-col items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary">
                  <div className="text-2xl font-bold">{story.story_points}</div>
                  <div className="text-xs">points</div>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* User Story */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">User Story</h3>
            <div className="bg-muted/50 p-4 rounded-lg space-y-2 border-l-4 border-primary">
              <p className="text-base">
                As a{" "}
                <span className="font-semibold text-primary">
                  {story.user_role}
                </span>
                ,
              </p>
              <p className="text-base">
                I want{" "}
                <span className="font-semibold text-primary">
                  {story.action}
                </span>
              </p>
              <p className="text-base">
                so that{" "}
                <span className="font-semibold text-primary">
                  {story.benefit}
                </span>
              </p>
            </div>
          </div>

          {/* Acceptance Criteria */}
          {story.acceptance_criteria &&
            story.acceptance_criteria.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Acceptance Criteria</h3>
                </div>
                <ol className="space-y-2 list-decimal list-inside">
                  {story.acceptance_criteria.map((criterion, index) => (
                    <li
                      key={index}
                      className="text-base text-muted-foreground pl-2"
                    >
                      <span className="text-foreground">{criterion}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

          {/* Timestamps */}
          <div className="flex items-center gap-4 pt-4 border-t text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>
                Created: {format(new Date(story.created_at), "MMM dd, yyyy")}
              </span>
            </div>
            {story.updated_at !== story.created_at && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>
                  Updated: {format(new Date(story.updated_at), "MMM dd, yyyy")}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dependencies */}
      <DependencyList
        story={story}
        outgoing={dependenciesData?.outgoing || []}
        incoming={dependenciesData?.incoming || []}
        isLoading={false}
        onStoryClick={handleDependencyClick}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteUserStoryDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        story={story}
        projectId={projectId}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
