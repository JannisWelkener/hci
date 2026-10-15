import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { Wireframe, CreateWireframeData, UpdateWireframeData } from '@/lib/types/database'

// 1. ワイヤーフレーム一覧を取得するフック
export function useWireframes(projectId: string) {
  return useQuery({
    queryKey: ['wireframes', projectId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/wireframes`)
      if (!response.ok) throw new Error('Failed to fetch wireframes')
      return response.json() as Promise<Wireframe[]>
    },
    enabled: !!projectId, // projectIdがある時だけ実行
    placeholderData: (previousData) => previousData, // Keep previous data while refetching to prevent loading states
  })
}

// 2. 新しいワイヤーフレームを作成（アップロード）するフック
export function useCreateWireframe(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateWireframeData) => {
      // JSONではなく、FormDataオブジェクトを作成して送信します
      const formData = new FormData()

      formData.append('title', data.title)
      formData.append('type', data.type)

      if (data.description) formData.append('description', data.description)
      if (data.version) formData.append('version', data.version.toString())
      if (data.user_story_id) formData.append('user_story_id', data.user_story_id)

      // タイプに応じたデータの追加
      if (data.type === 'upload' && data.file) {
        formData.append('file', data.file)
      } else if (data.type === 'figma' && data.figma_url) {
        formData.append('figma_url', data.figma_url)
      }

      const response = await fetch(`/api/projects/${projectId}/wireframes`, {
        method: 'POST',
        body: formData, // ここでFormDataを渡すのが重要！
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create wireframe')
      }

      return response.json() as Promise<Wireframe>
    },
    // Optimistic update: Add the new wireframe to the cache immediately
    onSuccess: (newWireframe) => {
      queryClient.setQueryData<Wireframe[]>(['wireframes', projectId], (old) => {
        return old ? [...old, newWireframe] : [newWireframe]
      })
    },
  })
}

// 3. ワイヤーフレームを削除するフック
export function useDeleteWireframe(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (wireframeId: string) => {
      const response = await fetch(`/api/projects/${projectId}/wireframes/${wireframeId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete wireframe')
      return wireframeId
    },
    // Optimistic update: Remove the wireframe from cache immediately
    onSuccess: (deletedWireframeId) => {
      queryClient.setQueryData<Wireframe[]>(['wireframes', projectId], (old) => {
        return old?.filter((wireframe) => wireframe.id !== deletedWireframeId)
      })
    },
  })
}

// 4. ワイヤーフレーム情報を更新するフック
export function useUpdateWireframe(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      wireframeId,
      data
    }: {
      wireframeId: string;
      data: UpdateWireframeData
    }) => {
      const response = await fetch(`/api/projects/${projectId}/wireframes/${wireframeId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error('Failed to update wireframe')
      return response.json() as Promise<Wireframe>
    },
    // Optimistic update: Update the wireframe in cache immediately
    onSuccess: (updatedWireframe) => {
      queryClient.setQueryData<Wireframe[]>(['wireframes', projectId], (old) => {
        return old?.map((wireframe) =>
          wireframe.id === updatedWireframe.id ? updatedWireframe : wireframe
        )
      })
    },
  })
}

// 5. ワイヤーフレームをプリフェッチするフック（パフォーマンス向上のため）
export function usePrefetchWireframe(projectId: string) {
  const queryClient = useQueryClient()

  return useCallback(
    (wireframeId: string) => {
      // First check if we already have this data in the list cache
      const listData = queryClient.getQueryData<Wireframe[]>(['wireframes', projectId])
      const cachedWireframe = listData?.find((wireframe) => wireframe.id === wireframeId)

      if (cachedWireframe) {
        // If we have it in the list cache, set it as the single item cache
        queryClient.setQueryData(['wireframes', projectId, wireframeId], cachedWireframe)
      }
      // For wireframes, we don't need to prefetch from API since we always have the full data in the list
    },
    [projectId, queryClient]
  )
}