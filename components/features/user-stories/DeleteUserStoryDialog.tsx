"use client";

import Link from "next/link";
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
import { Badge } from "@/components/ui/badge";
import { ExternalLink, AlertTriangle, Loader2 } from "lucide-react";
import type { UserStory } from "@/lib/types/database";
import {
  useUserStoryJourneyMapDependencies,
  useUserStoryIncomingDependencies,
} from "@/lib/hooks/use-user-stories";
import {
  getPriorityColor,
  getStatusColor,
  formatPriority,
  formatStatus,
} from "@/lib/utils/badge-styles";
import { cn } from "@/lib/utils";

interface DeleteUserStoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  story: UserStory;
  projectId: string;
  onConfirm: () => void | Promise<void>;
  isDeleting?: boolean;
}

export function DeleteUserStoryDialog({
  open,
  onOpenChange,
  story,
  projectId,
  onConfirm,
  isDeleting = false,
}: DeleteUserStoryDialogProps) {
  // Fetch journey map dependencies
  const { data: journeyMapDepsData, isLoading: journeyMapDepsLoading } =
    useUserStoryJourneyMapDependencies(projectId, story.id, {
      enabled: open,
    });

  // Fetch incoming story dependencies
  const { data: incomingDepsData, isLoading: incomingDepsLoading } =
    useUserStoryIncomingDependencies(projectId, story.id, {
      enabled: open,
    });

  const journeyMapDependencies = journeyMapDepsData?.journeyMaps || [];
  const hasJourneyMapDeps = (journeyMapDepsData?.count || 0) > 0;
  const incomingDependencies = incomingDepsData?.incoming || [];
  const hasIncomingDeps = (incomingDepsData?.count || 0) > 0;

  const isLoading = journeyMapDepsLoading || incomingDepsLoading;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete User Story</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{story.title}&quot;? This
            action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Journey Map Dependencies Warning */}
        {!journeyMapDepsLoading && hasJourneyMapDeps && (
          <div className="my-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
              <div className="flex-1 space-y-3">
                <div>
                  <h4 className="font-semibold text-destructive mb-1">
                    Cascade Deletion Warning
                  </h4>
                  <p className="text-sm text-foreground/90">
                    Deleting this user story will also permanently delete the
                    following {journeyMapDependencies.length} journey{" "}
                    {journeyMapDependencies.length === 1 ? "map" : "maps"} that
                    reference it:
                  </p>
                </div>

                {/* Scrollable List of Journey Maps */}
                <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                  {journeyMapDependencies.map((journeyMap) => (
                    <div
                      key={journeyMap.id}
                      className="flex items-center justify-between rounded-md border bg-background p-3 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-base truncate">
                          {journeyMap.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Created{" "}
                          {new Date(journeyMap.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Link
                        href={`/projects/${projectId}/user-journey-maps`}
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

        {/* Incoming Story Dependencies Warning */}
        {!incomingDepsLoading && hasIncomingDeps && (
          <div className="my-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
              <div className="flex-1 space-y-3">
                <div>
                  <h4 className="font-semibold text-destructive mb-1">
                    Dependency Update Warning
                  </h4>
                  <p className="text-sm text-foreground/90">
                    Deleting this user story will also automatically update the
                    following {incomingDependencies.length}{" "}
                    {incomingDependencies.length === 1 ? "story" : "stories"}{" "}
                    that depend on it:
                  </p>
                </div>

                {/* Scrollable List of Dependent Stories */}
                <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                  {incomingDependencies.map((dep) => (
                    <div
                      key={dep.id}
                      className="flex items-center justify-between rounded-md border bg-background p-3 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="font-semibold text-base truncate">
                          {dep.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          As a {dep.user_role}, {dep.action}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              getStatusColor(dep.status ?? "")
                            )}
                          >
                            {formatStatus(dep.status ?? "")}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              getPriorityColor(dep.priority ?? "")
                            )}
                          >
                            {formatPriority(dep.priority ?? "")}
                          </Badge>
                        </div>
                      </div>
                      <Link
                        href={`/projects/${projectId}/user-stories/${dep.id}`}
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
          <AlertDialogCancel disabled={isLoading || isDeleting}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isLoading || isDeleting}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : hasJourneyMapDeps || hasIncomingDeps ? (
              (() => {
                const parts = ["Delete Story"];
                if (hasJourneyMapDeps) {
                  parts.push(
                    `${journeyMapDependencies.length} Journey ${
                      journeyMapDependencies.length === 1 ? "Map" : "Maps"
                    }`
                  );
                }
                if (hasIncomingDeps) {
                  parts.push(
                    `Update ${incomingDependencies.length} ${
                      incomingDependencies.length === 1
                        ? "Dependency"
                        : "Dependencies"
                    }`
                  );
                }
                return parts.join(" & ");
              })()
            ) : (
              "Delete"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
