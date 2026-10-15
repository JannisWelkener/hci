"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import {
  useProject,
  useUpdateProject,
  useDeleteProject,
} from "@/lib/hooks/use-projects";
import { ProjectForm, type ProjectFormValues } from "@/components/features/projects";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Pencil,
  Trash2,
  Calendar,
  CheckCircle2,
  Clock,
  Circle,
  ArrowLeft,
} from "lucide-react";
import { format } from "date-fns";
import type { IsoPhase, PhaseStatusValue } from "@/lib/types/database";

// Phase labels for display
const PHASE_LABELS: Record<IsoPhase, string> = {
  understand_context: "Understand Context of Use",
  specify_requirements: "Specify Requirements",
  produce_design_solutions: "Produce Design Solutions",
  evaluate_against_requirements: "Evaluate Against Requirements",
};

const PHASE_STATUS_LABELS: Record<PhaseStatusValue, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  completed: "Completed",
};

export default function ProjectViewPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;

  const [isEditMode, setIsEditMode] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: project, isLoading } = useProject(projectId);
  const updateMutation = useUpdateProject();
  const deleteMutation = useDeleteProject();

  if (isLoading) {
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

  const handleEditSubmit = async (values: ProjectFormValues) => {
    await updateMutation.mutateAsync({
      id: projectId,
      data: values,
    });
    setIsEditMode(false);
  };

  const handleConfirmDelete = async () => {
    await deleteMutation.mutateAsync(projectId);
    setShowDeleteDialog(false);
    router.push("/projects");
  };

  const getStatusIcon = (status: PhaseStatusValue) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusVariant = (status: PhaseStatusValue): "default" | "secondary" | "outline" => {
    switch (status) {
      case "completed":
        return "default";
      case "in_progress":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="w-full h-full py-4 px-2 sm:px-3 lg:px-4">
      {/* Back Button - only show in view mode */}
      {!isEditMode && (
        <div className="mb-6">
          <BackButton onClick={() => router.push(`/projects/${projectId}/dashboard`)} />
        </div>
      )}

      {isEditMode ? (
        /* Edit Mode */
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Edit Project</CardTitle>
              <CardDescription>
                Update the project details and phase information below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProjectForm
                project={project}
                onSubmit={handleEditSubmit}
                onCancel={() => setIsEditMode(false)}
                isLoading={updateMutation.isPending}
              />
            </CardContent>
          </Card>
        </div>
      ) : (
        /* View Mode */
        <div className="space-y-6">
          {/* Project Header Card with Name and Actions */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-2xl">{project.name}</CardTitle>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => setIsEditMode(true)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardHeader>

          <CardContent className="space-y-6">
            {/* Description */}
            {project.description && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Description</h3>
                <div className="bg-muted/50 p-4 rounded-lg border-l-4 border-primary">
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {project.description}
                  </p>
                </div>
              </div>
            )}

            {/* Start Date */}
            {project.start_date && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Start Date</h3>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{format(new Date(project.start_date), "MMMM d, yyyy")}</span>
                </div>
              </div>
            )}

            {/* Current Phase */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Current Phase</h3>
              <Badge variant="outline" className="text-sm">
                {PHASE_LABELS[project.current_phase as IsoPhase]}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Phase Status Overview */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Phase Progress</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(PHASE_LABELS).map(([phaseKey, phaseLabel]) => {
              const status = project.phase_status?.[phaseKey as IsoPhase] || "not_started";
              return (
                <div
                  key={phaseKey}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(status)}
                    <span className="font-medium">{phaseLabel}</span>
                  </div>
                  <Badge variant={getStatusVariant(status)}>
                    {PHASE_STATUS_LABELS[status]}
                  </Badge>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Metadata */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Metadata</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Created:</span>
              <span className="ml-2 font-medium">
                {format(new Date(project.created_at), "MMM d, yyyy 'at' h:mm a")}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Last Updated:</span>
              <span className="ml-2 font-medium">
                {format(new Date(project.updated_at), "MMM d, yyyy 'at' h:mm a")}
              </span>
            </div>
          </div>
        </Card>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the project "{project.name}" and all
              associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Project"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
