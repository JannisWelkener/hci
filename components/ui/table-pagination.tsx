'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface TablePaginationProps {
  currentPage: number
  totalPages: number
  onPreviousPage: () => void
  onNextPage: () => void
  canPreviousPage: boolean
  canNextPage: boolean
}

export function TablePagination({
  currentPage,
  totalPages,
  onPreviousPage,
  onNextPage,
  canPreviousPage,
  canNextPage,
}: TablePaginationProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </div>
      <div className="flex items-center space-x-2">
        {canPreviousPage && (
          <Button
            variant="outline"
            size="sm"
            onClick={onPreviousPage}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
        )}
        {canNextPage && (
          <Button
            variant="outline"
            size="sm"
            onClick={onNextPage}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
