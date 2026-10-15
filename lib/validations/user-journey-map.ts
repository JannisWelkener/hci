import { z } from 'zod'

// Validation schema for a single journey stage
export const journeyStageSchema = z.object({
  name: z.string()
    .min(1, 'Stage name is required')
    .max(100, 'Stage name must be 100 characters or less'),
  description: z.string()
    .min(1, 'Stage description is required')
    .max(500, 'Stage description must be 500 characters or less'),
  actions: z.array(z.string())
    .min(0, 'Actions must be an array')
    .default([]),
  thoughts: z.array(z.string())
    .min(0, 'Thoughts must be an array')
    .default([]),
  emotions: z.number()
    .min(1, 'Emotions must be between 1 and 5')
    .max(5, 'Emotions must be between 1 and 5'),
  painPoints: z.array(z.string())
    .min(0, 'Pain points must be an array')
    .default([]),
  opportunities: z.array(z.string())
    .min(0, 'Opportunities must be an array')
    .default([]),
  touchpoints: z.array(z.string())
    .min(0, 'Touchpoints must be an array')
    .default([]),
})

// Validation schema for the journey map form (without stages - handled separately)
export const createUserJourneyMapFormSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less'),
  description: z.string()
    .max(2000, 'Description must be 2000 characters or less')
    .nullable()
    .optional(),
  persona_id: z.string()
    .uuid('Invalid persona ID')
    .min(1, 'Persona selection is required'),
  timeline: z.array(z.string().uuid('Invalid user story ID'))
    .min(1, 'At least one user story must be selected')
    .max(50, 'Maximum 50 user stories allowed in timeline'),
  ai_optimize_timeline: z.boolean()
    .default(false),
})

// Validation schema for creating a user journey map (with stages for API)
export const createUserJourneyMapSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less'),
  description: z.string()
    .max(2000, 'Description must be 2000 characters or less')
    .nullable()
    .optional(),
  persona_id: z.string()
    .uuid('Invalid persona ID')
    .min(1, 'Persona selection is required'),
  timeline: z.array(z.string().uuid('Invalid user story ID'))
    .min(1, 'At least one user story must be selected')
    .max(50, 'Maximum 50 user stories allowed in timeline'),
  ai_optimize_timeline: z.boolean()
    .default(false),
  stages: z.array(journeyStageSchema)
    .min(1, 'At least one stage is required')
    .max(10, 'Maximum 10 stages allowed'),
})

// Validation schema for updating a user journey map
export const updateUserJourneyMapSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less')
    .optional(),
  description: z.string()
    .max(2000, 'Description must be 2000 characters or less')
    .nullable()
    .optional(),
  ai_optimize_timeline: z.boolean()
    .optional(),
  timeline: z.array(z.string().uuid('Invalid user story ID'))
    .min(1, 'At least one user story must be selected')
    .max(50, 'Maximum 50 user stories allowed in timeline')
    .optional(),
  stages: z.array(journeyStageSchema)
    .min(1, 'At least one stage is required')
    .max(10, 'Maximum 10 stages allowed')
    .optional(),
})

// Type inference from schemas
export type JourneyStageInput = z.infer<typeof journeyStageSchema>
export type CreateUserJourneyMapFormInput = z.infer<typeof createUserJourneyMapFormSchema>
export type CreateUserJourneyMapInput = z.infer<typeof createUserJourneyMapSchema>
export type UpdateUserJourneyMapInput = z.infer<typeof updateUserJourneyMapSchema>
