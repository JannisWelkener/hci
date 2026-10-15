import { z } from 'zod'

// User story priority levels
const userStoryPrioritySchema = z.enum(['low', 'medium', 'high', 'critical'])

// User story status values
const userStoryStatusSchema = z.enum(['backlog', 'in_progress', 'done'])

// Generation method (manual vs AI-generated)
const generationMethodSchema = z.enum(['manual', 'ai_generated'])

// User story creation schema
export const createUserStorySchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less')
    .trim(),

  user_role: z.string()
    .min(1, 'User role is required')
    .max(100, 'User role must be 100 characters or less')
    .trim(),

  action: z.string()
    .min(1, 'Action is required')
    .max(500, 'Action must be 500 characters or less')
    .trim(),

  benefit: z.string()
    .min(1, 'Benefit is required')
    .max(500, 'Benefit must be 500 characters or less')
    .trim(),

  description: z.string()
    .max(2000, 'Description must be 2000 characters or less')
    .trim()
    .optional()
    .nullable(),

  acceptance_criteria: z.array(
    z.string()
      .max(500, 'Each acceptance criterion must be 500 characters or less')
      .trim()
  )
    .optional()
    .default([])
    .transform(val => val.filter(item => item.length > 0)), // Remove empty strings

  priority: userStoryPrioritySchema.optional().default('medium'),

  priority_order: z.number()
    .int('Priority order must be an integer')
    .optional(),

  status: userStoryStatusSchema.optional().default('backlog'),

  story_points: z.number()
    .int('Story points must be an integer')
    .positive('Story points must be positive')
    .max(100, 'Story points must be 100 or less')
    .optional()
    .nullable(),

  generation_method: generationMethodSchema.optional().default('manual'),

  dependencies: z.array(z.string().uuid('Invalid dependency UUID'))
    .optional()
    .default([])
    .transform(val => Array.from(new Set(val))), // Remove duplicates
})

// User story update schema (all fields optional)
export const updateUserStorySchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less')
    .trim()
    .optional(),

  user_role: z.string()
    .min(1, 'User role is required')
    .max(100, 'User role must be 100 characters or less')
    .trim()
    .optional(),

  action: z.string()
    .min(1, 'Action is required')
    .max(500, 'Action must be 500 characters or less')
    .trim()
    .optional(),

  benefit: z.string()
    .min(1, 'Benefit is required')
    .max(500, 'Benefit must be 500 characters or less')
    .trim()
    .optional(),

  description: z.string()
    .max(2000, 'Description must be 2000 characters or less')
    .trim()
    .optional()
    .nullable(),

  acceptance_criteria: z.array(
    z.string()
      .max(500, 'Each acceptance criterion must be 500 characters or less')
      .trim()
  )
    .transform(val => val.filter(item => item.length > 0)) // Remove empty strings
    .optional(),

  priority: userStoryPrioritySchema.optional(),

  priority_order: z.number()
    .int('Priority order must be an integer')
    .optional(),

  status: userStoryStatusSchema.optional(),

  story_points: z.number()
    .int('Story points must be an integer')
    .positive('Story points must be positive')
    .max(100, 'Story points must be 100 or less')
    .optional()
    .nullable(),

  generation_method: generationMethodSchema.optional(),

  dependencies: z.array(z.string().uuid('Invalid dependency UUID'))
    .optional()
    .transform(val => val ? Array.from(new Set(val)) : val), // Remove duplicates if provided
})

// Query parameters for GET /api/projects/[projectId]/user-stories
export const getUserStoriesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
  sort: z.enum(['priority', 'priority_order', 'status', 'created_at', 'updated_at', 'title']).optional().default('created_at'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
})

// AI generation request schema
export const generateUserStorySchema = z.object({
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must be 2000 characters or less')
    .trim()
})

// Bulk reorder schema
export const reorderUserStoriesSchema = z.object({
  stories: z.array(
    z.object({
      id: z.string().uuid('Invalid story ID format'),
      priority_order: z.number().int('Priority order must be an integer')
    })
  )
    .min(1, 'At least one story is required')
    .max(100, 'Cannot reorder more than 100 stories at once')
})

// Type exports
export type CreateUserStoryInput = z.infer<typeof createUserStorySchema>
export type UpdateUserStoryInput = z.infer<typeof updateUserStorySchema>
export type GetUserStoriesQuery = z.infer<typeof getUserStoriesQuerySchema>
export type GenerateUserStoryInput = z.infer<typeof generateUserStorySchema>
export type ReorderUserStoriesInput = z.infer<typeof reorderUserStoriesSchema>
