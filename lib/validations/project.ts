import { z } from 'zod'

// ISO 9241-210 phases
const isoPhaseSchema = z.enum([
  'understand_context',
  'specify_requirements',
  'produce_design_solutions',
  'evaluate_against_requirements',
])

const phaseStatusValueSchema = z.enum(['not_started', 'in_progress', 'completed'])

const phaseStatusSchema = z.object({
  understand_context: phaseStatusValueSchema,
  specify_requirements: phaseStatusValueSchema,
  produce_design_solutions: phaseStatusValueSchema,
  evaluate_against_requirements: phaseStatusValueSchema,
})

// Project creation schema
export const createProjectSchema = z.object({
  name: z.string()
    .min(1, 'Project name is required')
    .max(200, 'Project name must be 200 characters or less')
    .trim(),

  description: z.string()
    .max(2000, 'Description must be 2000 characters or less')
    .optional()
    .nullable()
    .transform(val => val?.trim() || null),

  start_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format')
    .optional()
    .default(new Date().toISOString().split('T')[0]),

  current_phase: isoPhaseSchema.optional().default('understand_context'),

  phase_status: phaseStatusSchema.optional().default({
    understand_context: 'not_started',
    specify_requirements: 'not_started',
    produce_design_solutions: 'not_started',
    evaluate_against_requirements: 'not_started',
  }),
})

// Project update schema
export const updateProjectSchema = z.object({
  name: z.string()
    .min(1, 'Project name is required')
    .max(200, 'Project name must be 200 characters or less')
    .trim()
    .optional(),

  description: z.string()
    .max(2000, 'Description must be 2000 characters or less')
    .nullable()
    .transform(val => val?.trim() || null)
    .optional(),

  start_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format')
    .optional(),

  current_phase: isoPhaseSchema.optional(),

  phase_status: phaseStatusSchema.optional(),
})

// Query parameters for GET /api/projects
export const getProjectsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(100),
  sort: z.enum(['created_at', 'updated_at', 'start_date', 'name']).optional().default('created_at'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
  phase: isoPhaseSchema.optional(),
  search: z.string().optional(),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
export type GetProjectsQuery = z.infer<typeof getProjectsQuerySchema>
