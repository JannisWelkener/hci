"use client";

import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { UserStory } from "@/lib/types/database";
import { formatPriority, getPriorityColor } from "@/lib/utils/badge-styles";

interface DependencySelectorProps {
  currentStoryId?: string;
  availableStories: UserStory[];
  value: string[];
  onChange: (dependencies: string[]) => void;
  disabled?: boolean;
}

export function DependencySelector({
  currentStoryId,
  availableStories,
  value,
  onChange,
  disabled = false,
}: DependencySelectorProps) {
  const [open, setOpen] = useState(false);

  // Filter out current story and already selected stories
  const filteredStories = useMemo(() => {
    const selectedIds = new Set(value);
    return availableStories.filter(
      (story) => story.id !== currentStoryId && !selectedIds.has(story.id)
    );
  }, [availableStories, currentStoryId, value]);

  const handleAddDependency = (storyId: string) => {
    onChange([...value, storyId]);
    setOpen(false);
  };

  const handleRemoveDependency = (storyId: string) => {
    onChange(value.filter((id) => id !== storyId));
  };

  const getStoryById = (storyId: string) => {
    return availableStories.find((story) => story.id === storyId);
  };

  return (
    <div className="space-y-3">
      {/* Add Dependency Button */}
      <Popover open={open} onOpenChange={setOpen} modal={false}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between"
            disabled={disabled || filteredStories.length === 0}
          >
            {filteredStories.length === 0
              ? "No more stories available"
              : "Add dependency..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="p-0"
          align="start"
          side="bottom"
          sideOffset={4}
          style={{ width: "var(--radix-popover-trigger-width)" }}
        >
          <Command>
            <CommandInput placeholder="Search user stories..." />
            <CommandList>
              <CommandEmpty>No story found.</CommandEmpty>
              <CommandGroup>
                {filteredStories.map((story) => (
                  <CommandItem
                    key={story.id}
                    value={`${story.title} ${story.user_role} ${story.action}`}
                    onSelect={() => handleAddDependency(story.id)}
                  >
                    <Check className={cn("mr-2 h-4 w-4", "opacity-0")} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{story.title}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        As a {story.user_role}, I want to {story.action}
                      </div>
                    </div>
                    {story.priority && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          getPriorityColor(story.priority || "medium")
                        )}
                      >
                        {formatPriority(story.priority || "medium")}
                      </Badge>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected Dependencies */}
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((storyId) => {
            const story = getStoryById(storyId);
            if (!story) return null;

            return (
              <div
                key={storyId}
                className="flex items-center gap-2 p-2 border rounded-md "
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {story.title}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    As a {story.user_role}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveDependency(storyId)}
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
      {/* Help Text */}
      {value.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No dependencies added yet. Dependencies help track relationships
          between user stories.
        </p>
      )}
    </div>
  );
}
