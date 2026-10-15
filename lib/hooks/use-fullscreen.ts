'use client'

import { useState, useEffect, RefObject } from 'react'
import { toast } from 'sonner'

interface UseFullscreenReturn {
  isFullscreen: boolean
  toggleFullscreen: () => void
}

/**
 * Custom hook to manage fullscreen mode for an element
 * @param elementRef - Ref to the element that should go fullscreen
 * @returns Object with isFullscreen state and toggleFullscreen function
 */
export function useFullscreen(
  elementRef: RefObject<HTMLElement | null>
): UseFullscreenReturn {
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Fullscreen toggle function
  const toggleFullscreen = () => {
    if (!elementRef.current) return

    if (!document.fullscreenElement) {
      elementRef.current.requestFullscreen().catch((err) => {
        toast.error(`Failed to enter fullscreen: ${err.message}`)
      })
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // Listen for fullscreen changes (ESC key, etc.)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  return {
    isFullscreen,
    toggleFullscreen,
  }
}
