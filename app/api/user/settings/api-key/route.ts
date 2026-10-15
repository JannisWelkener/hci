// File: app/api/user/settings/api-key/route.ts

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { encrypt, maskApiKey, isValidApiKeyFormat } from '@/lib/encryption'

/**
 * @method POST
 * @description Save or update user's OpenAI API key
 *
 * Request body:
 * - apiKey: string (required, must start with "sk-", min 20 chars)
 *
 * Response:
 * - success: boolean
 * - message: string
 * - maskedKey: string (masked key like "sk-...abc123")
 *
 * Error codes:
 * - UNAUTHORIZED: User is not authenticated
 * - INVALID_API_KEY: API key format is invalid
 * - SERVER_ERROR: Database or encryption error
 */
export async function POST(request: Request) {
  try {
    // 1. Authenticate user
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // 2. Parse and validate request body
    const body = await request.json()
    const { apiKey } = body

    if (!apiKey || typeof apiKey !== 'string') {
      return NextResponse.json(
        { error: 'API key is required', code: 'INVALID_API_KEY' },
        { status: 400 }
      )
    }

    const trimmedKey = apiKey.trim()

    if (!isValidApiKeyFormat(trimmedKey)) {
      return NextResponse.json(
        {
          error: 'Invalid API key format. Key must start with "sk-" and be at least 20 characters.',
          code: 'INVALID_API_KEY'
        },
        { status: 400 }
      )
    }

    // 3. Encrypt the API key
    const encryptedData = encrypt(trimmedKey)

    // 4. Upsert user settings
    const { error } = await supabase
      .from('user_settings')
      .upsert(
        {
          user_id: user.id,
          openai_api_key_encrypted: encryptedData.encrypted,
          openai_api_key_iv: encryptedData.iv,
          openai_api_key_tag: encryptedData.tag,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      )

    if (error) {
      console.error('Error saving API key:', error)
      return NextResponse.json(
        { error: 'Failed to save API key', code: 'SERVER_ERROR' },
        { status: 500 }
      )
    }

    console.log('✅ API key saved for user:', user.id)

    return NextResponse.json({
      success: true,
      message: 'API key saved successfully',
      maskedKey: maskApiKey(trimmedKey),
    })

  } catch (error: unknown) {
    console.error('Error in api-key POST:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * @method DELETE
 * @description Remove user's stored OpenAI API key
 *
 * Response:
 * - success: boolean
 * - message: string
 *
 * Error codes:
 * - UNAUTHORIZED: User is not authenticated
 * - NOT_FOUND: No API key found
 * - SERVER_ERROR: Database error
 */
export async function DELETE() {
  try {
    // 1. Authenticate user
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // 2. Update user settings to remove API key
    const { data: existing } = await supabase
      .from('user_settings')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!existing) {
      return NextResponse.json(
        { error: 'No API key found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    // 3. Clear the API key fields (keep the settings row)
    const { error } = await supabase
      .from('user_settings')
      .update({
        openai_api_key_encrypted: null,
        openai_api_key_iv: null,
        openai_api_key_tag: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    if (error) {
      console.error('Error removing API key:', error)
      return NextResponse.json(
        { error: 'Failed to remove API key', code: 'SERVER_ERROR' },
        { status: 500 }
      )
    }

    console.log('✅ API key removed for user:', user.id)

    return NextResponse.json({
      success: true,
      message: 'API key removed successfully',
    })

  } catch (error: unknown) {
    console.error('Error in api-key DELETE:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
