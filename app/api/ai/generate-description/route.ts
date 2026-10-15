// File: app/api/ai/generate-description/route.ts

import { NextResponse } from 'next/server'
import { getUserApiKey } from '@/lib/ai/get-user-api-key'

/**
 * @method POST
 * @description Generate or enhance project descriptions using AI
 *
 * Request body:
 * - projectName: string (required, 1-200 characters)
 * - currentDescription?: string (optional, max 2000 characters)
 *
 * Response:
 * - description: string (generated description, max 2000 characters)
 *
 * Error codes:
 * - MISSING_PROJECT_NAME: Project name is required
 * - PROJECT_NAME_TOO_LONG: Project name exceeds 200 characters
 * - DESCRIPTION_TOO_LONG: Description exceeds 2000 characters
 * - UNAUTHORIZED: User is not authenticated
 * - AI_SERVICE_ERROR: OpenAI API error
 * - TIMEOUT: Request exceeded 30 second timeout
 */
export async function POST(request: Request) {
  try {
    // 1. Authenticate user and get API key
    const { apiKey, error: keyError, userId } = await getUserApiKey()

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: keyError || 'API key not configured', code: 'NO_API_KEY' },
        { status: 401 }
      )
    }

    // 2. Parse and validate request body
    const { projectName, currentDescription } = await request.json()

    // Validate project name
    if (!projectName) {
      return NextResponse.json(
        { error: 'Project name is required', code: 'MISSING_PROJECT_NAME' },
        { status: 400 }
      )
    }

    if (typeof projectName !== 'string' || projectName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Project name is required', code: 'MISSING_PROJECT_NAME' },
        { status: 400 }
      )
    }

    if (projectName.length > 200) {
      return NextResponse.json(
        { error: 'Project name must be 200 characters or less', code: 'PROJECT_NAME_TOO_LONG' },
        { status: 400 }
      )
    }

    // Validate current description if provided
    if (currentDescription && currentDescription.length > 2000) {
      return NextResponse.json(
        { error: 'Description must be 2000 characters or less', code: 'DESCRIPTION_TOO_LONG' },
        { status: 400 }
      )
    }

    console.log('🤖 Generating description for project:', projectName)
    console.log('📝 Has existing description:', !!currentDescription)

    // 4. Build AI prompt
    const systemPrompt = `You are an assistant helping HCI and UX Design students write project descriptions for their human-centered design projects. Generate clear, comprehensive descriptions that are academically appropriate but not overly formal.`

    const userPrompt = `Given a project name${currentDescription ? ' and existing description' : ''}, generate a clear, comprehensive project description that includes:
- Project goals and objectives
- Target users or stakeholders
- Scope boundaries (what's included)
- Expected outcomes
- Relevant HCI/UX methodology context (based on ISO 9241-210 if applicable)

DO NOT include timeline, milestones, or specific dates.

Use a balanced, professional tone suitable for academic projects. Keep the description to 2-3 paragraphs (approximately 200-400 words).

Project Name: ${projectName}
${currentDescription ? `Current Description: ${currentDescription}` : ''}

Generate the enhanced project description:`

    // 5. Call OpenAI API with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    try {
      const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: userPrompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 800,
        }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      const aiData = await aiResponse.json()

      // Check if OpenAI returned an error (e.g., quota exceeded, invalid key)
      if (!aiResponse.ok || aiData.error) {
        console.error('OpenAI API error:', aiResponse.status, aiData)
        return NextResponse.json(
          {
            error: 'OpenAI request failed',
            code: aiData?.error?.code || 'AI_SERVICE_ERROR',
            message: aiData?.error?.message || 'Unknown OpenAI error',
          },
          { status: 502 }
        )
      }

      const aiContent = aiData.choices?.[0]?.message?.content

      if (!aiContent) {
        console.error('No content in AI response:', aiData)
        return NextResponse.json(
          { error: 'No response from AI', code: 'AI_SERVICE_ERROR', message: 'The AI returned an empty response' },
          { status: 500 }
        )
      }

      // 6. Validate and process the generated description
      const generatedDescription = aiContent.trim()

      if (generatedDescription.length === 0) {
        return NextResponse.json(
          { error: 'AI service temporarily unavailable. Please try again.', code: 'AI_SERVICE_ERROR' },
          { status: 500 }
        )
      }

      // Truncate if exceeds 2000 characters (should not happen with max_tokens: 800)
      const finalDescription = generatedDescription.length > 2000
        ? generatedDescription.substring(0, 2000)
        : generatedDescription

      console.log('✅ Description generated successfully, length:', finalDescription.length)

      // 7. Return the generated description
      return NextResponse.json({
        description: finalDescription,
      })

    } catch (fetchError: unknown) {
      clearTimeout(timeoutId)

      // Handle timeout
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('OpenAI API timeout after 30 seconds')
        return NextResponse.json(
          { error: 'Description generation timed out. Please try again.', code: 'TIMEOUT' },
          { status: 504 }
        )
      }

      throw fetchError // Re-throw other errors
    }

  } catch (error: unknown) {
    console.error('Error in generate-description API:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'AI_SERVICE_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
