"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Sparkles } from "lucide-react"

import { useAIKey } from "@/lib/contexts/AIKeyContext"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import type { Project, IsoPhase, PhaseStatusValue } from "@/lib/types/database"

// Form schema combining create and update schemas
const projectFormSchema = z.object({
  name: z.string()
    .min(1, 'Project name is required')
    .max(200, 'Project name must be 200 characters or less')
    .trim(),

  description: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        const trimmed = val.trim()
        return trimmed === '' ? null : trimmed
      }
      return val
    },
    z.string().max(2000, 'Description must be 2000 characters or less').nullable()
  ),

  start_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),

  current_phase: z.enum([
    'understand_context',
    'specify_requirements',
    'produce_design_solutions',
    'evaluate_against_requirements',
  ] as const),

  phase_status: z.object({
    understand_context: z.enum(['not_started', 'in_progress', 'completed'] as const),
    specify_requirements: z.enum(['not_started', 'in_progress', 'completed'] as const),
    produce_design_solutions: z.enum(['not_started', 'in_progress', 'completed'] as const),
    evaluate_against_requirements: z.enum(['not_started', 'in_progress', 'completed'] as const),
  }),
})

export type ProjectFormValues = z.infer<typeof projectFormSchema>

interface ProjectFormProps {
  project?: Project | null
  onSubmit: (data: ProjectFormValues) => void | Promise<void>
  onCancel?: () => void
  isLoading?: boolean
}

// Phase labels for better UX
const PHASE_LABELS: Record<IsoPhase, string> = {
  understand_context: 'Understand Context of Use',
  specify_requirements: 'Specify Requirements',
  produce_design_solutions: 'Produce Design Solutions',
  evaluate_against_requirements: 'Evaluate Against Requirements',
}

const PHASE_STATUS_LABELS: Record<PhaseStatusValue, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
}

export function ProjectForm({
  project,
  onSubmit,
  onCancel,
  isLoading = false,
}: ProjectFormProps) {
  const isEditMode = !!project
  const { hasAIKey } = useAIKey()

  // AI generation states
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [showErrorDialog, setShowErrorDialog] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState('')

  // Initialize form with React Hook Form and Zod validation
  const form = useForm({
    resolver: zodResolver(projectFormSchema),
    mode: 'onBlur', // Validate on blur for real-time feedback
    defaultValues: project
      ? {
          name: project.name,
          description: project.description,
          start_date: project.start_date,
          current_phase: project.current_phase,
          phase_status: project.phase_status,
        }
      : {
          name: '',
          description: null,
          start_date: new Date().toISOString().split('T')[0],
          current_phase: 'understand_context',
          phase_status: {
            understand_context: 'not_started',
            specify_requirements: 'not_started',
            produce_design_solutions: 'not_started',
            evaluate_against_requirements: 'not_started',
          },
        },
  })

  const handleSubmit = async (data: ProjectFormValues) => {
    await onSubmit(data)
  }

  /**
   * Handle AI-powered description generation
   */
  const handleEnhanceWithAI = async () => {
    setIsGenerating(true)

    try {
      // Get current project name and description
      const projectName = form.getValues('name')
      const currentDescription = form.getValues('description')

      // Validate project name is not empty
      if (!projectName || projectName.trim().length === 0) {
        setErrorMessage('Please enter a project name before using AI optimization.')
        setShowErrorDialog(true)
        return
      }

      // Make API call to generate description
      const response = await fetch('/api/ai/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: projectName,
          currentDescription: currentDescription || undefined,
        }),
      })

      // Try to parse JSON, but don't assume it always exists
      let data: { description?: string; error?: string; message?: string } | null = null
      try {
        data = await response.json()
      } catch {
        // ignore parse errors; we'll handle via response.ok
      }

      if (!response.ok) {
        const errorMessage = data?.message || data?.error || `Request failed (${response.status})`
        throw new Error(errorMessage)
      }

      if (!data?.description) {
        throw new Error('No description returned from AI')
      }

      // Update form field with generated description
      form.setValue('description', data.description, { shouldValidate: true })

    } catch (error) {
      console.error('AI generation error:', error)
      // Show error dialog with message
      setErrorMessage(error instanceof Error ? error.message : 'AI service temporarily unavailable. Please try again.')
      setShowErrorDialog(true)

    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Project Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Name *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter project name"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormDescription>
                A clear, descriptive name for your HCI project (max 200 characters)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between mb-2">
                <FormLabel>Description</FormLabel>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span tabIndex={!hasAIKey ? 0 : undefined}>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleEnhanceWithAI}
                          disabled={isGenerating || isLoading || !hasAIKey}
                          className="h-7 px-2 gap-1"
                          aria-label="Enhance project description with AI"
                        >
                          <Sparkles className={`h-3.5 w-3.5 ${isGenerating ? 'animate-pulse' : ''}`} />
                          <span className="text-xs">
                            {isGenerating ? 'Generating with AI...' : 'AI Optimize'}
                          </span>
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {!hasAIKey && (
                      <TooltipContent>
                        <p>Add your OpenAI API key in Settings to use AI features</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </div>
              <FormControl>
                <Textarea
                  placeholder="Describe your project goals, scope, and objectives"
                  className="resize-none h-24"
                  {...field}
                  value={(field.value as string | null) ?? ''}
                  disabled={isLoading}
                />
              </FormControl>
              <FormDescription>
                Provide context about your project (optional, max 2000 characters)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Start Date */}
        <FormField
          control={form.control}
          name="start_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start Date *</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                  disabled={isLoading}
                  min="2020-01-01"
                  max="2030-12-31"
                />
              </FormControl>
              <FormDescription>
                When did or will this project begin?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Current Phase */}
        <FormField
          control={form.control}
          name="current_phase"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Phase *</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select current phase" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(PHASE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Which ISO 9241-210 phase is your project currently in?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Phase Status Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Phase Status</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Track the progress of each ISO 9241-210 phase
            </p>
          </div>

          {/* Understand Context Phase */}
          <FormField
            control={form.control}
            name="phase_status.understand_context"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{PHASE_LABELS.understand_context}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(PHASE_STATUS_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Specify Requirements Phase */}
          <FormField
            control={form.control}
            name="phase_status.specify_requirements"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{PHASE_LABELS.specify_requirements}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(PHASE_STATUS_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Produce Design Solutions Phase */}
          <FormField
            control={form.control}
            name="phase_status.produce_design_solutions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{PHASE_LABELS.produce_design_solutions}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(PHASE_STATUS_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Evaluate Against Requirements Phase */}
          <FormField
            control={form.control}
            name="phase_status.evaluate_against_requirements"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{PHASE_LABELS.evaluate_against_requirements}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(PHASE_STATUS_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-between pt-4 border-t">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2"
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2"
          >
            {isLoading ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Project'}
          </Button>
        </div>
      </form>

      {/* Error Dialog */}
      <AlertDialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Description Generation Failed</AlertDialogTitle>
            <AlertDialogDescription>{errorMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowErrorDialog(false)}>
              Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Form>
  )
}
