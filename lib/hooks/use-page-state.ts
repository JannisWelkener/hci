'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export interface PageStateConfig<T extends Record<string, string>> {
  /**
   * Unique key for sessionStorage
   */
  storageKey: string

  /**
   * Default values for the state
   */
  defaultValues: T

  /**
   * Keys that should reset page to 1 when changed
   * Usually filter/search parameters
   */
  resetPageOn?: (keyof T)[]
}

export interface UsePageStateReturn<T extends Record<string, string>> {
  /**
   * Current state values
   */
  state: T

  /**
   * Update state and sync to URL
   */
  updateState: (updates: Partial<T>) => void

  /**
   * Whether state has been restored from sessionStorage
   */
  isRestored: boolean
}

/**
 * Central hook for managing page state with sessionStorage and URL synchronization
 *
 * @example
 * ```tsx
 * const { state, updateState } = usePageState({
 *   storageKey: 'personasPageState',
 *   defaultValues: { page: '1' },
 * })
 *
 * // Update page
 * updateState({ page: '2' })
 * ```
 *
 * @example With filters
 * ```tsx
 * const { state, updateState } = usePageState({
 *   storageKey: 'projectsPageState',
 *   defaultValues: { page: '1', view: 'grid', search: '', phase: 'all' },
 *   resetPageOn: ['search', 'phase'], // Reset page when these change
 * })
 * ```
 */
export function usePageState<T extends Record<string, string>>({
  storageKey,
  defaultValues,
  resetPageOn = [],
}: PageStateConfig<T>): UsePageStateReturn<T> {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [hasRestoredState, setHasRestoredState] = useState(false)

  // Initialize state from URL params
  const getInitialState = (): T => {
    const state = { ...defaultValues }
    Object.keys(defaultValues).forEach((key) => {
      const value = searchParams.get(key)
      if (value !== null) {
        state[key as keyof T] = value as T[keyof T]
      }
    })
    return state
  }

  const [state, setState] = useState<T>(getInitialState)

  // Save current state to sessionStorage whenever it changes
  useEffect(() => {
    if (hasRestoredState && typeof window !== 'undefined') {
      sessionStorage.setItem(storageKey, JSON.stringify(state))
    }
  }, [state, storageKey, hasRestoredState])

  // Restore state from sessionStorage on mount
  useEffect(() => {
    if (!hasRestoredState && typeof window !== 'undefined') {
      const savedState = sessionStorage.getItem(storageKey)
      if (savedState) {
        try {
          const parsed = JSON.parse(savedState) as T

          // Update internal state first
          setState(parsed)

          const params = new URLSearchParams()

          // Build URL params from saved state, excluding default values
          Object.entries(parsed).forEach(([key, value]) => {
            if (value && value !== defaultValues[key as keyof T]) {
              params.set(key, value)
            }
          })

          const queryString = params.toString()
          if (queryString) {
            router.replace(`?${queryString}`, { scroll: false })
          }

          // Clear the saved state after restoring
          sessionStorage.removeItem(storageKey)
        } catch (e) {
          console.error(`Failed to restore page state for ${storageKey}:`, e)
        }
      }
      setHasRestoredState(true)
    }
  }, [hasRestoredState, router, storageKey, defaultValues])

  // Update state (URL sync happens in useEffect)
  const updateState = useCallback((updates: Partial<T>) => {
    setState((prev) => {
      const newState = { ...prev, ...updates }

      // Reset page if specified keys changed
      const shouldResetPage = resetPageOn.some(
        (key) => updates[key] !== undefined && updates[key] !== prev[key]
      )

      if (shouldResetPage && 'page' in newState) {
        newState.page = defaultValues.page
      }

      return newState
    })
  }, [defaultValues, resetPageOn])

  // Sync state to URL (happens after render)
  useEffect(() => {
    if (!hasRestoredState) return

    const params = new URLSearchParams()
    Object.entries(state).forEach(([key, value]) => {
      if (value && value !== defaultValues[key as keyof T]) {
        params.set(key, value)
      }
    })

    const queryString = params.toString()
    const newUrl = queryString ? `?${queryString}` : window.location.pathname

    // Only update if URL actually changed
    if (window.location.search !== (queryString ? `?${queryString}` : '')) {
      router.replace(newUrl, { scroll: false })
    }
  }, [state, hasRestoredState, router, defaultValues])

  return {
    state,
    updateState,
    isRestored: hasRestoredState,
  }
}
