/**
 * Utility to fetch and decrypt user's OpenAI API key for AI routes
 */

import { createClient } from '@/lib/supabase/server'
import { decrypt } from '@/lib/encryption'

export interface GetUserApiKeyResult {
  apiKey: string | null
  error: string | null
  userId: string | null
}

/**
 * Fetches and decrypts the user's OpenAI API key
 * Falls back to server environment variable if user has no key
 * @returns The decrypted API key or null with error message
 */
export async function getUserApiKey(): Promise<GetUserApiKeyResult> {
  try {
    // 1. Authenticate user
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return {
        apiKey: null,
        error: 'Authentication required',
        userId: null,
      }
    }

    // 2. Try to get user's personal API key
    const { data: settings, error } = await supabase
      .from('user_settings')
      .select('openai_api_key_encrypted, openai_api_key_iv, openai_api_key_tag')
      .eq('user_id', user.id)
      .single()

    // If user has a personal key, decrypt and return it
    if (!error && settings?.openai_api_key_encrypted) {
      try {
        const decryptedKey = decrypt({
          encrypted: settings.openai_api_key_encrypted,
          iv: settings.openai_api_key_iv,
          tag: settings.openai_api_key_tag,
        })

        return {
          apiKey: decryptedKey,
          error: null,
          userId: user.id,
        }
      } catch (decryptError) {
        console.error('Failed to decrypt user API key:', decryptError)
        // Fall through to check server key
      }
    }

    // 3. No user key - return error (no fallback to server key)
    return {
      apiKey: null,
      error: 'API key not configured. Please add your OpenAI API key in Settings.',
      userId: user.id,
    }

  } catch (error) {
    console.error('Error getting user API key:', error)
    return {
      apiKey: null,
      error: 'Failed to retrieve API key',
      userId: null,
    }
  }
}
