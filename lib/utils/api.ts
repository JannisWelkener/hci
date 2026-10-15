import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/lib/types/database'

/**
 * Create a success API response
 */
export function successResponse<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    data,
    error: null,
  }, { status })
}

/**
 * Create an error API response
 */
export function errorResponse(
  message: string,
  status = 500,
  code?: string
): NextResponse<ApiResponse<null>> {
  return NextResponse.json({
    data: null,
    error: { message, code },
  }, { status })
}

/**
 * Validate authentication
 */
export function validateAuth(userId: string | null | undefined): boolean {
  return !!userId
}

/**
 * Calculate pagination metadata
 */
export function calculatePagination(
  total: number,
  page: number,
  limit: number
) {
  const totalPages = Math.ceil(total / limit)
  const hasMore = page < totalPages

  return {
    page,
    limit,
    total,
    totalPages,
    hasMore,
  }
}
