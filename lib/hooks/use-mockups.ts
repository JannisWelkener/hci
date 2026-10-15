// File: lib/hooks/use-mockups.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import {
  type Mockup,
  type CreateMockupData,
  type UpdateMockupData,
} from '@/lib/types/database';

// A helper function to fetch data from our API
// This simplifies the 'queryFn' in useQuery
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const errorBody = await res.json();
    throw new Error(errorBody.error || 'Failed to fetch data');
  }
  return res.json();
};

// --- Query Hooks (for fetching data) ---

/**
 * (Hook 1) Fetches all mockups for a specific project.
 */
export const useMockups = (projectId: string) => {
  const queryKey = ['mockups', projectId]; // Unique key for this query

  return useQuery<Mockup[]>({
    queryKey: queryKey,

    // ↓↓↓ ここを修正しました ↓↓↓
    queryFn: () => {
      // もしprojectIdがまだ 'undefined' なら、APIを呼ばずに空の配列を返す
      if (!projectId) {
        return Promise.resolve([]);
      }
      // projectId がある場合のみ、APIを呼ぶ
      return fetcher(`/api/projects/${projectId}/mockups`);
    },
    // ↑↑↑ ここまで修正 ↑↑↑

    enabled: !!projectId, // Only run query if projectId is available
    placeholderData: (previousData) => previousData, // Keep previous data while refetching to prevent loading states
  });
};

/**
 * (Hook 2) Fetches a single mockup by its ID.
 */
export const useMockup = (projectId: string, mockupId: string) => {
  const queryKey = ['mockups', projectId, mockupId];
  const queryClient = useQueryClient();

  return useQuery<Mockup>({
    queryKey: queryKey,

    // ↓↓↓ ここを修正しました ↓↓↓
    queryFn: () => {
      // どちらかのIDが 'undefined' なら、APIを呼ばない
      if (!projectId || !mockupId) {
        return Promise.resolve(null as unknown as Mockup); // nullを返す
      }
      // 両方のIDがある場合のみ、APIを呼ぶ
      return fetcher(`/api/projects/${projectId}/mockups/${mockupId}`);
    },
    // ↑↑↑ ここまで修正 ↑↑↑

    enabled: !!projectId && !!mockupId, // Only run if both IDs are available
    placeholderData: (previousData) => previousData, // Keep previous data while refetching
    initialData: () => {
      // Try to use data from the list query cache if available
      const listData = queryClient.getQueryData<Mockup[]>(['mockups', projectId]);
      return listData?.find((mockup) => mockup.id === mockupId);
    },
  });
};

// --- Mutation Hooks (for creating, updating, deleting data) ---

/**
 * (Hook 3) Creates a new mockup.
 */
export const useCreateMockup = (projectId: string) => {
  const queryClient = useQueryClient(); // Gets access to the cache

  return useMutation({
    // Calls the POST endpoint from Phase 4
    mutationFn: async (mockupData: CreateMockupData): Promise<Mockup> => {
      const res = await fetch(`/api/projects/${projectId}/mockups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockupData),
      });
      if (!res.ok) {
        const errorBody = await res.json();
        throw new Error(errorBody.error?.message || 'Failed to create mockup');
      }
      return res.json();
    },
    // Optimistic update: Add the new mockup to the cache immediately
    onSuccess: (newMockup) => {
      queryClient.setQueryData<Mockup[]>(['mockups', projectId], (old) => {
        return old ? [...old, newMockup] : [newMockup];
      });
    },
  });
};

/**
 * (Hook 4) Updates an existing mockup.
 */
export const useUpdateMockup = (projectId: string, mockupId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    // Calls the PATCH endpoint from Phase 4
    mutationFn: async (
      mockupData: UpdateMockupData
    ): Promise<Mockup> => {
      const res = await fetch(
        `/api/projects/${projectId}/mockups/${mockupId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mockupData),
        }
      );
      if (!res.ok) {
        const errorBody = await res.json();
        throw new Error(errorBody.error?.message || 'Failed to update mockup');
      }
      return res.json();
    },
    // Optimistic update: Update both the list and single item cache immediately
    onSuccess: (updatedMockup) => {
      // Update the list cache
      queryClient.setQueryData<Mockup[]>(['mockups', projectId], (old) => {
        return old?.map((mockup) =>
          mockup.id === mockupId ? updatedMockup : mockup
        );
      });
      // Update the single item cache
      queryClient.setQueryData(['mockups', projectId, mockupId], updatedMockup);
    },
  });
};

/**
 * (Hook 5) Deletes a mockup.
 */
export const useDeleteMockup = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    // Calls the DELETE endpoint from Phase 4
    mutationFn: async (mockupId: string) => {
      const res = await fetch(
        `/api/projects/${projectId}/mockups/${mockupId}`,
        {
          method: 'DELETE',
        }
      );
      if (!res.ok) {
        const errorBody = await res.json();
        throw new Error(errorBody.error?.message || 'Failed to delete mockup');
      }
      // DELETE returns 204 No Content, so no JSON to parse
      return mockupId;
    },
    // Optimistic update: Remove the mockup from cache immediately
    onSuccess: (deletedMockupId) => {
      queryClient.setQueryData<Mockup[]>(['mockups', projectId], (old) => {
        return old?.filter((mockup) => mockup.id !== deletedMockupId);
      });
      // Remove the single item from cache
      queryClient.removeQueries({ queryKey: ['mockups', projectId, deletedMockupId] });
    },
  });
};

/**
 * (Hook 6) Prefetches a mockup to improve loading performance.
 * Use this on hover or before navigation to preload data.
 */
export const usePrefetchMockup = (projectId: string) => {
  const queryClient = useQueryClient();

  return useCallback(
    (mockupId: string) => {
      // First check if we already have this data in the list cache
      const listData = queryClient.getQueryData<Mockup[]>(['mockups', projectId]);
      const cachedMockup = listData?.find((mockup) => mockup.id === mockupId);

      if (cachedMockup) {
        // If we have it in the list cache, set it as the single item cache
        queryClient.setQueryData(['mockups', projectId, mockupId], cachedMockup);
      } else {
        // Otherwise, prefetch from the API
        queryClient.prefetchQuery({
          queryKey: ['mockups', projectId, mockupId],
          queryFn: () => fetcher(`/api/projects/${projectId}/mockups/${mockupId}`),
          staleTime: 30 * 60 * 1000, // 30 minutes
        });
      }
    },
    [projectId, queryClient]
  );
};