"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
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

import type { Mockup, MockupType } from "@/lib/types/database";
import { isFigmaUrl } from "@/lib/utils/figma";

// =============================
// 🔹 1. Zod Schema Definition
// =============================
const mockupFormSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required.")
    .max(200, "Title must be within 200 characters.")
    .trim(),

  description: z
    .string()
    .max(2000, "Description must be within 2000 characters.")
    .nullable()
    .optional(),

  figma_url: z
    .string()
    .min(1, "Figma URL is required.")
    .url("Please enter a valid URL format.")
    .refine(isFigmaUrl, "Please enter a valid Figma URL (figma.com/file/...)."),

  type: z.enum(["design", "prototype", "figjam"] as const),
});

export type MockupFormValues = z.infer<typeof mockupFormSchema>;

// =============================
// 🔹 2. Props Definition
// =============================
interface MockupFormProps {
  mockup?: Mockup | null;
  onSubmit: (data: MockupFormValues) => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

// =============================
// 🔹 3. Type Labels
// =============================
const MOCKUP_TYPE_LABELS: Record<MockupType, string> = {
  design: "Design File",
  prototype: "Prototype",
  figjam: "FigJam Board",
};

// =============================
// 🔹 4. Main Component
// =============================
export function MockupForm({
  mockup,
  onSubmit,
  onCancel,
  isLoading = false,
}: MockupFormProps) {
  const isEditMode = !!mockup;

  const form = useForm<MockupFormValues>({
    resolver: zodResolver(mockupFormSchema),
    mode: "onSubmit",
    defaultValues: mockup
      ? {
          title: mockup.title,
          description: mockup.description ?? "",
          figma_url: mockup.figma_url,
          type: mockup.type,
        }
      : {
          title: "",
          description: "",
          figma_url: "",
          type: "design",
        },
  });

  const handleSubmit = async (data: MockupFormValues) => {
    const dataToSubmit = {
      ...data,
      description: data.description?.trim() === "" ? null : data.description,
    };
    await onSubmit(dataToSubmit);
  };

  // =============================
  // 🔹 JSX Layout
  // =============================
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* --- Title --- */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title *</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. Homepage Mockup V2"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormDescription>
                A clear name for this Figma mockup (max 200 characters)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* --- Figma URL --- */}
        <FormField
          control={form.control}
          name="figma_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Figma URL *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Paste your Figma share link here"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormDescription>
                Must be a valid Figma file, prototype, or FigJam link.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* --- Description --- */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add notes or background information (optional)"
                  className="resize-none h-24"
                  {...field}
                  value={field.value ?? ""}
                  disabled={isLoading}
                />
              </FormControl>
              <FormDescription>
                Additional details about this mockup (optional, up to 2000
                characters)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* --- Type --- */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mockup Type *</FormLabel>
              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select the type of Figma link" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(MOCKUP_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value as MockupType}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormDescription>
                Choose whether this is a design file, prototype, or FigJam board.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* --- Buttons --- */}
        <div className="flex justify-end gap-2 pt-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? "Saving..."
              : isEditMode
              ? "Update Mockup"
              : "Create Mockup"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
