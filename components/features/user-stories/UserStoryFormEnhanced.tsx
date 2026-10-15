"use client";

import { useState, useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AcceptanceCriteriaInput } from "./AcceptanceCriteriaInput";
import {
  GenerationModeToggle,
  type GenerationMode,
} from "./GenerationModeToggle";
import { DependencySelector } from "./DependencySelector";
import type { UserStory } from "@/lib/types/database";
import { useGenerateAIStory } from "@/lib/hooks/use-user-stories";
import { toast } from "sonner";

// Base schema for common fields
const baseFormSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less")
    .trim(),

  user_role: z
    .string()
    .min(1, "User role is required")
    .max(100, "User role must be 100 characters or less")
    .trim(),

  action: z
    .string()
    .min(1, "Action is required")
    .max(500, "Action must be 500 characters or less")
    .trim(),

  benefit: z
    .string()
    .min(1, "Benefit is required")
    .max(500, "Benefit must be 500 characters or less")
    .trim(),

  acceptance_criteria: z
    .array(
      z
        .string()
        .max(500, "Each criterion must be 500 characters or less")
        .trim()
    )
    .default([]),

  priority: z.enum(["low", "medium", "high", "critical"] as const),

  status: z.enum(["backlog", "in_progress", "done"] as const),

  story_points: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return null;
      const num = Number(val);
      return isNaN(num) ? null : num;
    },
    z
      .number()
      .int("Story points must be an integer")
      .refine((val) => val === null || [1, 2, 3, 5, 8, 13].includes(val), {
        message: "Story points must be a Fibonacci number (1, 2, 3, 5, 8, 13)",
      })
      .nullable()
  ),

  dependencies: z
    .array(z.string().uuid())
    .default([]),
});

// Complete form schema with optional description
// Description is only required for AI generation (validated separately in handleGenerateAI)
const userStoryFormSchema = baseFormSchema.extend({
  description: z
    .string()
    .max(2000, "Description must be 2000 characters or less")
    .trim()
    .optional(),
});

type UserStoryFormValues = z.infer<typeof userStoryFormSchema>;

interface UserStoryFormEnhancedProps {
  projectId: string;
  defaultValues?: Partial<UserStory>;
  availableStories?: UserStory[];
  onSubmit: SubmitHandler<
    UserStoryFormValues & { generation_method: "manual" | "ai_generated" }
  >;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export function UserStoryFormEnhanced({
  projectId,
  defaultValues,
  availableStories = [],
  onSubmit,
  isSubmitting = false,
  submitLabel = "Save User Story",
}: UserStoryFormEnhancedProps) {
  const [generationMode, setGenerationMode] = useState<GenerationMode>(
    defaultValues?.generation_method === "ai_generated" ? "ai" : "manual"
  );
  const [aiDescription, setAiDescription] = useState(
    defaultValues?.description || ""
  );

  const generateAI = useGenerateAIStory(projectId);

  const form = useForm<UserStoryFormValues>({
    resolver: zodResolver(userStoryFormSchema),
    defaultValues: {
      title: defaultValues?.title || "",
      user_role: defaultValues?.user_role || "",
      action: defaultValues?.action || "",
      benefit: defaultValues?.benefit || "",
      description: defaultValues?.description || "",
      acceptance_criteria: Array.isArray(defaultValues?.acceptance_criteria)
        ? defaultValues.acceptance_criteria
        : [],
      priority: (defaultValues?.priority ||
        "medium") as UserStoryFormValues["priority"],
      status: (defaultValues?.status ||
        "backlog") as UserStoryFormValues["status"],
      story_points: defaultValues?.story_points ?? null,
      dependencies: defaultValues?.dependencies || [],
    },
  });

  const handleGenerateAI = async () => {
    if (!aiDescription.trim()) {
      toast.error("Please enter a description to generate a user story");
      return;
    }

    if (aiDescription.trim().length < 10) {
      toast.error("Description must be at least 10 characters");
      return;
    }

    try {
      await generateAI.mutateAsync(
        { description: aiDescription },
        {
          onSuccess: (generatedStory) => {
            // Populate form with AI-generated values
            form.setValue("title", generatedStory.title);
            form.setValue("user_role", generatedStory.user_role);
            form.setValue("action", generatedStory.action);
            form.setValue("benefit", generatedStory.benefit);
            form.setValue("description", aiDescription);
            form.setValue(
              "acceptance_criteria",
              generatedStory.acceptance_criteria || []
            );
            form.setValue("priority", generatedStory.priority || "medium");
            form.setValue("story_points", generatedStory.story_points);

            toast.success(
              "AI suggestion generated! You can now review and edit the fields."
            );
          },
        }
      );
    } catch (error) {
      // Error is already handled by the hook
      console.error("AI generation failed:", error);
    }
  };

  const handleSubmit: SubmitHandler<UserStoryFormValues> = async (values) => {
    const payload = {
      ...values,
      generation_method: generationMode === "ai" ? "ai_generated" : "manual",
    };

    // Remove description from payload in manual mode
    if (generationMode === "manual") {
      delete payload.description;
    }

    await onSubmit(payload);
  };

  // Watch description changes in AI mode
  const descriptionValue = form.watch("description");
  useEffect(() => {
    if (generationMode === "ai" && descriptionValue !== aiDescription) {
      setAiDescription(descriptionValue || "");
    }
  }, [descriptionValue, generationMode, aiDescription]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Generation Mode Toggle */}
        <GenerationModeToggle
          value={generationMode}
          onChange={setGenerationMode}
          disabled={isSubmitting || !!defaultValues?.id}
        />

        {/* AI Mode */}
        {generationMode === "ai" && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Describe Your User Story
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="e.g., Users need to be able to filter projects by status and category to find relevant items quickly..."
                      disabled={isSubmitting || generateAI.isPending}
                      rows={5}
                      className="resize-none"
                    />
                  </FormControl>
                  <FormDescription>
                    Describe what you want in plain language (10-2000
                    characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="button"
              onClick={handleGenerateAI}
              disabled={
                isSubmitting || generateAI.isPending || !aiDescription.trim()
              }
              className="w-full"
            >
              {generateAI.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate User Story with AI
                </>
              )}
            </Button>

            <div className="border-t pt-4 mt-4">
              <p className="text-sm text-muted-foreground mb-3">
                Review and edit the generated fields below:
              </p>
            </div>
          </div>
        )}

        {/* User Story Fields - Always visible but read-only in AI mode until generated */}
        <div className="space-y-4">
          <div className="border-b pb-2">
            <h3 className="text-lg font-semibold">User Story</h3>
            <p className="text-sm text-muted-foreground">
              {generationMode === "manual"
                ? 'Define the user story following the format: "As a [role], I want [action], so that [benefit]"'
                : "AI-generated fields - you can edit them below"}
            </p>
          </div>

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Brief title for the user story"
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormDescription>
                  A short, descriptive title (max 200 characters)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="user_role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>As a (User Role)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g., student, instructor, researcher"
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormDescription>
                  The user persona or role (max 100 characters)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="action"
            render={({ field }) => (
              <FormItem>
                <FormLabel>I want to (Action)</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="e.g., create and organize user stories for my HCI project"
                    disabled={isSubmitting}
                    rows={3}
                  />
                </FormControl>
                <FormDescription>
                  What the user wants to accomplish (max 500 characters)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="benefit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>So that (Benefit)</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="e.g., I can systematically document requirements and track progress"
                    disabled={isSubmitting}
                    rows={3}
                  />
                </FormControl>
                <FormDescription>
                  The value or benefit to the user (max 500 characters)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Acceptance Criteria Section */}
        <div className="space-y-4">
          <div className="border-b pb-2">
            <h3 className="text-lg font-semibold">Acceptance Criteria</h3>
            <p className="text-sm text-muted-foreground">
              Define the conditions that must be met for this story to be
              considered complete
            </p>
          </div>

          <AcceptanceCriteriaInput
            control={form.control}
            name="acceptance_criteria"
          />
        </div>

        {/* Dependencies Section */}
        <div className="space-y-4">
          <div className="border-b pb-2">
            <h3 className="text-lg font-semibold">Dependencies</h3>
            <p className="text-sm text-muted-foreground">
              Link this story to other stories it depends on or that depend on
              it
            </p>
          </div>

          <FormField
            control={form.control}
            name="dependencies"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <DependencySelector
                    currentStoryId={defaultValues?.id}
                    availableStories={availableStories}
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Metadata Section */}
        <div className="space-y-4">
          <div className="border-b pb-2">
            <h3 className="text-lg font-semibold">Metadata</h3>
            <p className="text-sm text-muted-foreground">
              Additional information for planning and tracking
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="backlog">Backlog</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="story_points"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Story Points</FormLabel>
                  <Select
                    onValueChange={(value) =>
                      field.onChange(value === "none" ? null : Number(value))
                    }
                    value={field.value?.toString() ?? "none"}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select points" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Not Estimated</SelectItem>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="8">8</SelectItem>
                      <SelectItem value="13">13</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Fibonacci estimation (1, 2, 3, 5, 8, 13)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
