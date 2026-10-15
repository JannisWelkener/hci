'use client';

import { useQuery } from '@tanstack/react-query';
import type { ProjectStats } from '@/lib/validations/dashboard';
import type { ApiResponse } from '@/lib/types/database';

/**
 * Fetch project dashboard statistics
 */
async function fetchProjectStats(projectId: string): Promise<ProjectStats> {
  const response = await fetch(`/api/projects/${projectId}/stats`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to fetch project stats');
  }

  const result: ApiResponse<ProjectStats> = await response.json();

  if (!result.data) {
    throw new Error('No data received from API');
  }

  return result.data;
}

/**
 * Hook to fetch and cache project dashboard statistics
 */
export function useProjectStats(projectId: string) {
  return useQuery({
    queryKey: ['projectStats', projectId],
    queryFn: () => fetchProjectStats(projectId),
    staleTime: 60000, // Consider data fresh for 1 minute
    refetchOnWindowFocus: true,
    enabled: !!projectId,
  });
}
