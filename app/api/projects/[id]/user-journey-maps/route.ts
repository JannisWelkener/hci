// File: app/api/projects/[id]/user-journey-maps/route.ts

import { createClient } from '@/lib/supabase/server'
import { createUserJourneyMapSchema } from '@/lib/validations/user-journey-map'
import { NextResponse } from 'next/server'

/**
 * @method POST
 * @description Create new user journey map
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Await params (Next.js 15 requirement)
  const { id: projectId } = await params

  // 1. Authenticate user
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Validate request body (Zod)
  const body = await request.json()
  const validation = createUserJourneyMapSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.format() },
      { status: 400 }
    )
  }

  const { title, description, persona_id, timeline, ai_optimize_timeline, stages } = validation.data

  // 3. Check if a journey map with the same title already exists in this project
  const { data: existingMaps, error: checkError } = await supabase
    .from('user_journey_maps')
    .select('id, title')
    .eq('project_id', projectId)
    .ilike('title', title.trim()) // Case-insensitive check

  if (checkError) {
    console.error('Error checking for duplicate titles:', checkError.message)
    return NextResponse.json({ error: checkError.message }, { status: 500 })
  }

  if (existingMaps && existingMaps.length > 0) {
    return NextResponse.json(
      { error: 'A journey map with this title already exists in this project' },
      { status: 409 } // 409 Conflict
    )
  }

  // 4. Prepare data for Supabase (journey map)
  const journeyMapData = {
    project_id: projectId,
    created_by: user.id,
    title: title.trim(),
    description: description ?? null,
    persona_id,
    ai_optimize_timeline: ai_optimize_timeline ?? false,
    stages,
  }

  // 5. Insert journey map
  const { data: journeyMap, error: journeyMapError } = await supabase
    .from('user_journey_maps')
    .insert(journeyMapData)
    .select()
    .single()

  if (journeyMapError) {
    console.error('Supabase error (journey map):', journeyMapError.message)
    return NextResponse.json({ error: journeyMapError.message }, { status: 500 })
  }

  // 6. Insert timeline entries
  const timelineEntries = timeline.map((user_story_id, index) => ({
    journey_map_id: journeyMap.id,
    user_story_id,
    position: index,
  }))

  const { error: timelineError } = await supabase
    .from('user_journey_map_timeline')
    .insert(timelineEntries)

  if (timelineError) {
    console.error('Supabase error (timeline):', timelineError.message)
    // Rollback: delete the journey map
    await supabase.from('user_journey_maps').delete().eq('id', journeyMap.id)
    return NextResponse.json({ error: timelineError.message }, { status: 500 })
  }

  // 7. Return JSON response with timeline
  return NextResponse.json(
    { ...journeyMap, timeline: timelineEntries },
    { status: 201 }
  )
}

/**
 * @method GET
 * @description List all user journey maps for a project
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Await params (Next.js 15 requirement)
  const { id: projectId } = await params

  // 1. Authenticate user
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!projectId) {
    return NextResponse.json({ error: 'Project ID is missing' }, { status: 400 })
  }

  // 2. Query Supabase (select ALL journey maps with timeline)
  try {
    const { data: journeyMaps, error } = await supabase
      .from('user_journey_maps')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error during GET:', error.message, 'ProjectId used:', projectId)
      if (error.message.includes('invalid input syntax for type uuid')) {
        return NextResponse.json({ error: `Invalid Project ID format: ${projectId}` }, { status: 400 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 3. Fetch timeline entries for all journey maps
    if (!journeyMaps || journeyMaps.length === 0) {
      return NextResponse.json([])
    }

    const journeyMapIds = journeyMaps.map(jm => jm.id)
    const { data: timelineEntries, error: timelineError } = await supabase
      .from('user_journey_map_timeline')
      .select('*')
      .in('journey_map_id', journeyMapIds)
      .order('position', { ascending: true })

    if (timelineError) {
      console.error('Supabase error fetching timeline:', timelineError.message)
      return NextResponse.json({ error: timelineError.message }, { status: 500 })
    }

    // 4. Combine journey maps with their timelines
    const journeyMapsWithTimeline = journeyMaps.map(journeyMap => ({
      ...journeyMap,
      timeline: (timelineEntries || []).filter(
        entry => entry.journey_map_id === journeyMap.id
      ),
    }))

    // 5. Return JSON response
    return NextResponse.json(journeyMapsWithTimeline)

  } catch (err: unknown) {
    console.error("Unexpected error in GET handler:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
