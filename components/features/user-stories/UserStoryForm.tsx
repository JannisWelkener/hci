"use client";

import * as React from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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
import { DependencySelector } from "./DependencySelector";
import type { UserStory } from "@/lib/types/database";

// Form schema combining create and update with client-side validation
const userStoryFormSchema = z.object({
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

type UserStoryFormValues = z.infer<typeof userStoryFormSchema>;

interface UserStoryFormProps {
  projectId: string;
  defaultValues?: Partial<UserStory>;
  availableStories?: UserStory[];
  onSubmit: SubmitHandler<UserStoryFormValues>;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export function UserStoryForm({
  projectId,
  defaultValues,
  availableStories = [],
  onSubmit,
  isSubmitting = false,
  submitLabel = "Save User Story",
}: UserStoryFormProps) {
  const form = useForm<UserStoryFormValues>({
    resolver: zodResolver(userStoryFormSchema),
    defaultValues: {
      title: defaultValues?.title || "",
      user_role: defaultValues?.user_role || "",
      action: defaultValues?.action || "",
      benefit: defaultValues?.benefit || "",
      acceptance_criteria: Array.isArray(defaultValues?.acceptance_criteria)
        ? defaultValues.acceptance_criteria
        : [],
      priority: (defaultValues?.priority ||
        "medium") as UserStoryFormValues["priority"],
      status: (defaultValues?.status ||
        "backlog") as UserStoryFormValues["status"],
      story_points: defaultValues?.story_points ?? null,
      dependencies: Array.isArray(defaultValues?.dependencies)
        ? defaultValues.dependencies
        : [],
    },
  });

  const handleSubmit: SubmitHandler<UserStoryFormValues> = async (values) => {
    await onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* User Story Section */}
        <div className="space-y-4">
          <div className="border-b pb-2">
            <h3 className="text-lg font-semibold">User Story</h3>
            <p className="text-sm text-muted-foreground">
              Define the user story following the format: &quot;As a [role], I
              want [action], so that [benefit]&quot;
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
