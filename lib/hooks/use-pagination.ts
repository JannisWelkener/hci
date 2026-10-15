import { useState, useMemo, useCallback, useEffect } from 'react'

interface UsePaginationProps {
  items: unknown[]
  itemsPerPage?: number
  initialPage?: number
}

interface UsePaginationReturn<T> {
  currentPage: number
  totalPages: number
  paginatedItems: T[]
  canPreviousPage: boolean
  canNextPage: boolean
  goToPage: (page: number) => void
  nextPage: () => void
  previousPage: () => void
  resetPage: () => void
}

/**
 * Reusable pagination hook for client-side pagination
 * @param items - Array of items to paginate
 * @param itemsPerPage - Number of items per page (default: 12)
 * @param initialPage - Initial page number (default: 1)
 * @returns Pagination state and controls
 */
export function usePagination<T = unknown>({
  items,
  itemsPerPage = 12,
  initialPage = 1,
}: UsePaginationProps): UsePaginationReturn<T> {
  const [currentPage, setCurrentPage] = useState(Math.max(1, initialPage))

  // Calculate total pages
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(items.length / itemsPerPage)),
    [items.length, itemsPerPage]
  )

  // Sync currentPage with initialPage when it changes (e.g., from URL)
  useEffect(() => {
    const validPage = Math.max(1, Math.min(initialPage, totalPages))
    setCurrentPage(validPage)
  }, [initialPage, totalPages])

  // Get paginated items for current page
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return items.slice(startIndex, endIndex) as T[]
  }, [items, currentPage, itemsPerPage])

  // Navigation controls
  const canPreviousPage = currentPage > 1
  const canNextPage = currentPage < totalPages

  const goToPage = useCallback(
    (page: number) => {
      const validPage = Math.max(1, Math.min(page, totalPages))
      setCurrentPage(validPage)
    },
    [totalPages]
  )

  const nextPage = useCallback(() => {
    if (canNextPage) {
      setCurrentPage((prev) => prev + 1)
    }
  }, [canNextPage])

  const previousPage = useCallback(() => {
    if (canPreviousPage) {
      setCurrentPage((prev) => prev - 1)
    }
  }, [canPreviousPage])

  const resetPage = useCallback(() => {
    setCurrentPage(1)
  }, [])

  return {
    currentPage,
    totalPages,
    paginatedItems,
    canPreviousPage,
    canNextPage,
    goToPage,
    nextPage,
    previousPage,
    resetPage,
  }
}
