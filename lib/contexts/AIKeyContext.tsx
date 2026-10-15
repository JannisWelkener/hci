'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode
} from 'react'

interface AIKeyContextValue {
  /** Whether the user has an API key configured */
  hasAIKey: boolean
  /** Whether the key status is being loaded */
  isLoading: boolean
  /** Masked version of the key (e.g., "sk-...abc123") */
  maskedKey: string | null
  /** Refresh the key status (call after save/remove) */
  refreshKeyStatus: () => Promise<void>
}

const AIKeyContext = createContext<AIKeyContextValue | undefined>(undefined)

interface AIKeyProviderProps {
  children: ReactNode
}

export function AIKeyProvider({ children }: AIKeyProviderProps) {
  const [hasAIKey, setHasAIKey] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [maskedKey, setMaskedKey] = useState<string | null>(null)

  const fetchKeyStatus = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/user/settings/api-key/status')

      if (response.ok) {
        const data = await response.json()
        setHasAIKey(data.hasKey)
        setMaskedKey(data.maskedKey)
      } else if (response.status === 401) {
        // User not authenticated - no key
        setHasAIKey(false)
        setMaskedKey(null)
      } else {
        console.error('Failed to fetch API key status:', response.status)
        setHasAIKey(false)
        setMaskedKey(null)
      }
    } catch (error) {
      console.error('Error fetching API key status:', error)
      setHasAIKey(false)
      setMaskedKey(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch key status on mount
  useEffect(() => {
    fetchKeyStatus()
  }, [fetchKeyStatus])

  const refreshKeyStatus = useCallback(async () => {
    await fetchKeyStatus()
  }, [fetchKeyStatus])

  const value: AIKeyContextValue = {
    hasAIKey,
    isLoading,
    maskedKey,
    refreshKeyStatus,
  }

  return (
    <AIKeyContext.Provider value={value}>
      {children}
    </AIKeyContext.Provider>
  )
}

/**
 * Hook to access AI key status
 * Returns safe defaults when used outside AIKeyProvider
 */
export function useAIKey(): AIKeyContextValue {
  const context = useContext(AIKeyContext)

  // Return safe defaults when outside provider (AI features disabled)
  if (context === undefined) {
    return {
      hasAIKey: false,
      isLoading: false,
      maskedKey: null,
      refreshKeyStatus: async () => {},
    }
  }

  return context
}
