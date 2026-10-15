'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Upload, Link as LinkIcon } from 'lucide-react'
import { FileDropzone } from '@/components/ui/file-dropzone'
import { useCreateWireframe } from '@/lib/hooks/use-wireframes'
import { CreateWireframeData } from '@/lib/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { isFigmaUrl } from '@/lib/utils/figma'

// Zod schema for wireframe form
const wireframeFormSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required.')
    .max(200, 'Title must be within 200 characters.')
    .trim(),
  description: z
    .string()
    .max(2000, 'Description must be within 2000 characters.')
    .nullable()
    .optional(),
  figma_url: z
    .string()
    .url('Please enter a valid URL format.')
    .refine(isFigmaUrl, 'Please enter a valid Figma URL (figma.com/file/...).')
    .optional()
    .or(z.literal('')),
  file: z.instanceof(File).optional(),
  type: z.enum(['upload', 'figma'] as const),
  version: z.number().min(1).optional(),
})

type WireframeFormValues = z.infer<typeof wireframeFormSchema>

interface WireframeFormProps {
  projectId: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function WireframeForm({ projectId, onSuccess, onCancel }: WireframeFormProps) {
  const [mode, setMode] = useState<'upload' | 'figma'>('upload')
  const { mutate: createWireframe, isPending } = useCreateWireframe(projectId)

  const form = useForm<WireframeFormValues>({
    resolver: zodResolver(wireframeFormSchema),
    mode: 'onSubmit',
    defaultValues: {
      title: '',
      description: '',
      figma_url: '',
      type: 'upload',
      version: 1,
    },
  })

  const handleSubmit = async (data: WireframeFormValues) => {
    const submitData: CreateWireframeData = {
      title: data.title,
      description: data.description?.trim() === '' ? null : data.description,
      type: mode,
      figma_url: mode === 'figma' ? data.figma_url : undefined,
      file: mode === 'upload' ? data.file : undefined,
      version: data.version,
    }

    createWireframe(submitData, {
      onSuccess: () => {
        form.reset()
        onSuccess?.()
      },
    })
  }

  const handleModeChange = (newMode: 'upload' | 'figma') => {
    setMode(newMode)
    form.setValue('type', newMode)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Mode Toggle Tabs */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleModeChange('upload')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium rounded-md border transition-all ${
              mode === 'upload'
                ? 'bg-card border-border shadow-sm text-blue-600 dark:text-blue-400'
                : 'bg-card border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground'
            }`}
          >
            <Upload className="w-4 h-4" />
            Upload File
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('figma')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium rounded-md border transition-all ${
              mode === 'figma'
                ? 'bg-card border-border shadow-sm text-purple-600 dark:text-purple-400'
                : 'bg-card border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            Figma Link
          </button>
        </div>

        {/* Title Field */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title *</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. Homepage Draft v1"
                  {...field}
                  disabled={isPending}
                />
              </FormControl>
              <FormDescription>
                A clear name for this wireframe (max 200 characters)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* File Upload or Figma URL Field */}
        {mode === 'upload' ? (
          <FormField
            control={form.control}
            name="file"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Wireframe File *</FormLabel>
                <FormControl>
                  <FileDropzone
                    onFileSelect={(file) => field.onChange(file)}
                    selectedFile={field.value}
                    onClear={() => field.onChange(undefined)}
                  />
                </FormControl>
                <FormDescription>
                  Upload your wireframe sketch or design file
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <FormField
            control={form.control}
            name="figma_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Figma URL *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://www.figma.com/file/..."
                    {...field}
                    disabled={isPending}
                  />
                </FormControl>
                <FormDescription>
                  Must be a valid Figma file, prototype, or design link
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Description Field */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add notes about this wireframe..."
                  className="resize-none h-24"
                  {...field}
                  value={field.value ?? ''}
                  disabled={isPending}
                />
              </FormControl>
              <FormDescription>
                Additional details about this wireframe (optional, up to 2000 characters)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Version Field */}
        <FormField
          control={form.control}
          name="version"
          render={({ field }) => (
            <FormItem className="w-1/3">
              <FormLabel>Version</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                  disabled={isPending}
                />
              </FormControl>
              <FormDescription>
                Version number
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isPending}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving...' : 'Save Wireframe'}
          </Button>
        </div>
      </form>
    </Form>
  )
}