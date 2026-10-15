"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, ArrowLeft, Link2, ExternalLink } from "lucide-react";
import type { UserStory } from "@/lib/types/database";
import { cn } from "@/lib/utils";
import {
  getPriorityColor,
  getStatusColor,
  BADGE_SIZE_CLASS,
} from "@/lib/utils/badge-styles";

interface DependencyListProps {
  story: UserStory;
  outgoing: UserStory[];
  incoming: UserStory[];
  isLoading?: boolean;
  onStoryClick?: (storyId: string) => void;
}

export function DependencyList({
  outgoing,
  incoming,
  isLoading = false,
  onStoryClick,
}: DependencyListProps) {
  if (isLoading) {
    return <DependencyListSkeleton />;
  }

  const totalDependencies = outgoing.length + incoming.length;

  if (totalDependencies === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Dependencies
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Link2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No dependencies for this story</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Dependencies
          </CardTitle>
          <Badge variant="secondary">
            {totalDependencies}{" "}
            {totalDependencies === 1 ? "dependency" : "dependencies"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Outgoing Dependencies */}
        {outgoing.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-semibold">This story depends on:</h4>
            </div>
            <div className="space-y-2 pl-6">
              {outgoing.map((depStory) => (
                <DependencyCard
                  key={depStory.id}
                  story={depStory}
                  icon={ArrowRight}
                  onClick={() => onStoryClick?.(depStory.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Incoming Dependencies */}
        {incoming.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-semibold">
                Stories that depend on this:
              </h4>
            </div>
            <div className="space-y-2 pl-6">
              {incoming.map((depStory) => (
                <DependencyCard
                  key={depStory.id}
                  story={depStory}
                  icon={ArrowLeft}
                  onClick={() => onStoryClick?.(depStory.id)}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface DependencyCardProps {
  story: UserStory;
  icon: typeof ArrowRight;
  onClick?: () => void;
}

function DependencyCard({
  story,
  icon: Icon,
  onClick,
}: DependencyCardProps) {
  return (
    <div
      className="group border rounded-lg p-3 hover:bg-muted/50 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {story.priority && (
                  <Badge
                    variant="outline"
                    className={cn(
                      BADGE_SIZE_CLASS,
                      "capitalize",
                      getPriorityColor(story.priority)
                    )}
                  >
                    {story.priority}
                  </Badge>
                )}
              </div>
              <h5 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                {story.title}
              </h5>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
          <div className="text-xs text-muted-foreground line-clamp-2">
            As a {story.user_role}, I want to {story.action}
          </div>
          <div className="flex items-center gap-2">
            {story.status && (
              <Badge
                variant="outline"
                className={cn(
                  BADGE_SIZE_CLASS,
                  "capitalize",
                  getStatusColor(story.status)
                )}
              >
                {story.status.replace("_", " ")}
              </Badge>
            )}
            {story.story_points && (
              <span className="text-xs text-muted-foreground">
                {story.story_points}{" "}
                {story.story_points === 1 ? "point" : "points"}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DependencyListSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <div className="pl-6 space-y-3">
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
