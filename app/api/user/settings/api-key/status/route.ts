// File: app/api/user/settings/api-key/status/route.ts

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { decrypt, maskApiKey } from '@/lib/encryption'

/**
 * @method GET
 * @description Check if user has an OpenAI API key configured
 *
 * Response:
 * - hasKey: boolean (true if key is configured)
 * - maskedKey: string | null (masked key like "sk-...abc123" or null)
 *
 * Error codes:
 * - UNAUTHORIZED: User is not authenticated
 * - SERVER_ERROR: Database or decryption error
 */
export async function GET() {
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

    // 2. Fetch user settings
    const { data: settings, error } = await supabase
      .from('user_settings')
      .select('openai_api_key_encrypted, openai_api_key_iv, openai_api_key_tag')
      .eq('user_id', user.id)
      .single()

    // No settings found = no key configured
    if (error && error.code === 'PGRST116') {
      return NextResponse.json({
        hasKey: false,
        maskedKey: null,
      })
    }

    if (error) {
      console.error('Error fetching user settings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch settings', code: 'SERVER_ERROR' },
        { status: 500 }
      )
    }

    // Check if key exists
    if (!settings?.openai_api_key_encrypted) {
      return NextResponse.json({
        hasKey: false,
        maskedKey: null,
      })
    }

    // 3. Decrypt key to generate masked version
    try {
      const decryptedKey = decrypt({
        encrypted: settings.openai_api_key_encrypted,
        iv: settings.openai_api_key_iv,
        tag: settings.openai_api_key_tag,
      })

      return NextResponse.json({
        hasKey: true,
        maskedKey: maskApiKey(decryptedKey),
      })
    } catch (decryptError) {
      console.error('Error decrypting API key:', decryptError)
      // Key exists but can't be decrypted - treat as corrupted
      return NextResponse.json({
        hasKey: true,
        maskedKey: 'sk-...(corrupted)',
      })
    }

  } catch (error: unknown) {
    console.error('Error in api-key status API:', error)
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
