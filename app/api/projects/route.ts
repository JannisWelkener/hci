import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { successResponse, errorResponse, calculatePagination } from '@/lib/utils/api'
import { getProjectsQuerySchema, createProjectSchema } from '@/lib/validations/project'
import type { Project } from '@/lib/types/database'

/**
 * GET /api/projects
 * Retrieve all projects accessible to the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return errorResponse('Unauthorized', 401)
    }

    // Parse and validate query parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams)
    const parseResult = getProjectsQuerySchema.safeParse(searchParams)

    if (!parseResult.success) {
      return errorResponse(
        `Invalid query parameters: ${parseResult.error.issues.map(e => e.message).join(', ')}`,
        400
      )
    }

    const { page, limit, sort, order, phase, search } = parseResult.data

    // Build query
    let query = supabase
      .from('projects')
      .select('*', { count: 'exact' })

    // Apply filters
    if (phase) {
      query = query.eq('current_phase', phase)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Apply sorting
    query = query.order(sort, { ascending: order === 'asc' })

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    // Execute query
    const { data: projects, error, count } = await query

    if (error) {
      console.error('Error fetching projects:', error)
      return errorResponse('Failed to fetch projects', 500)
    }

    // Calculate pagination metadata
    const pagination = calculatePagination(count ?? 0, page, limit)

    return successResponse({
      projects: projects as Project[],
      pagination,
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/projects:', error)
    return errorResponse('Internal server error', 500)
  }
}

/**
 * POST /api/projects
 * Create a new project
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return errorResponse('Unauthorized', 401)
    }

    // Parse request body
    const body = await request.json()

    // Validate request body
    const parseResult = createProjectSchema.safeParse(body)

    if (!parseResult.success) {
      return errorResponse(
        `Validation error: ${parseResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
        400
      )
    }

    const projectData = parseResult.data

    // Create project
    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        name: projectData.name,
        description: projectData.description,
        start_date: projectData.start_date,
        current_phase: projectData.current_phase,
        phase_status: projectData.phase_status,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating project:', error)
      return errorResponse('Failed to create project', 500)
    }

    // Add creator as owner in project_members
    const { error: memberError } = await supabase
      .from('project_members')
      .insert({
        project_id: project.id,
        user_id: user.id,
        role: 'owner',
      })

    if (memberError) {
      console.error('Error adding creator as project member:', memberError)
      // Don't fail the request if this fails - project is already created
      // Just log the error
    }

    return successResponse(project as Project, 201)
  } catch (error) {
    console.error('Unexpected error in POST /api/projects:', error)
    return errorResponse('Internal server error', 500)
  }
}
