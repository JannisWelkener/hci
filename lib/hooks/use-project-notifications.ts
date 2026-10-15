// File: lib/hooks/use-project-notifications.ts

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { NotificationWithDetails } from '@/lib/types/database'

interface UseProjectNotificationsOptions {
  /**
   * Project ID to fetch notifications for
   */
  projectId: string

  /**
   * Whether to enable the query (defaults to true)
   */
  enabled?: boolean
}

interface UseProjectNotificationsReturn {
  /**
   * Array of notifications for this project with denormalized user and project data
   */
  notifications: NotificationWithDetails[]

  /**
   * Total count of notifications for this project
   */
  totalCount: number

  /**
   * Loading state
   */
  isLoading: boolean

  /**
   * Error state
   */
  error: Error | null

  /**
   * Whether the query is currently fetching
   */
  isFetching: boolean
}

/**
 * Hook to fetch all notifications for a specific project.
 *
 * Features:
 * - Fetches notifications for a specific project only
 * - Shows activity from all project members (including yourself)
 * - Includes user and project information
 * - Orders by created_at DESC (newest first)
 * - Uses Supabase client with RLS for security
 *
 * @param options - Configuration for the query
 * @returns Notification data with loading and error states
 */
export function useProjectNotifications(
  options: UseProjectNotificationsOptions
): UseProjectNotificationsReturn {
  const { projectId, enabled = true } = options

  const queryResult = useQuery({
    queryKey: ['project-notifications', projectId],
    queryFn: async (): Promise<{
      notifications: NotificationWithDetails[]
      totalCount: number
    }> => {
      console.log('[useProjectNotifications] Starting fetch for project:', projectId)
      const supabase = createClient()

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      console.log('[useProjectNotifications] User:', user?.id, 'Error:', userError)

      if (!user) {
        console.error('[useProjectNotifications] No user found!')
        throw new Error('User not authenticated')
      }

      // Fetch notifications for this project
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('notifications')
        .select('id, user_id, creator_id, project_id, entity_type, entity_count, action, created_at, read, entity_id, entity_name')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      console.log('[useProjectNotifications] Query result:', {
        dataCount: notificationsData?.length,
        error: notificationsError,
      })

      if (notificationsError) {
        console.error('[useProjectNotifications] Query error:', notificationsError)
        throw new Error(notificationsError.message || 'Failed to fetch notifications')
      }

      if (!notificationsData || notificationsData.length === 0) {
        console.log('[useProjectNotifications] No notifications found for project')
        return { notifications: [], totalCount: 0 }
      }

      // Get unique creator IDs
      const creatorIds = [...new Set(notificationsData.map(n => n.creator_id))]

      console.log('[useProjectNotifications] Fetching profiles...', {
        creatorCount: creatorIds.length,
      })

      // Fetch creator profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', creatorIds)

      console.log('[useProjectNotifications] Profiles fetched:', {
        count: profiles?.length,
        error: profilesError,
      })

      // Create lookup map
      const profileMap = new Map((profiles || []).map(p => [p.id, p.full_name]))

      // Transform the data to match NotificationWithDetails interface
      const notifications: NotificationWithDetails[] = notificationsData.map(notification => ({
        id: notification.id,
        user_id: notification.user_id,
        creator_id: notification.creator_id,
        project_id: notification.project_id,
        entity_type: notification.entity_type,
        entity_count: notification.entity_count,
        action: notification.action,
        created_at: notification.created_at,
        read: notification.read,
        entity_id: notification.entity_id,
        entity_name: notification.entity_name,
        creator_name: profileMap.get(notification.creator_id) || 'Unknown User',
        project_name: '', // Not needed for project-specific view
      }))

      const totalCount = notifications.length

      return {
        notifications,
        totalCount,
      }
    },
    enabled: enabled && !!projectId,
    // Fetch fresh data when component mounts
    refetchOnMount: true,
    // Keep data fresh for 30 seconds
    staleTime: 30000,
    // Retry once on failure
    retry: 1,
  })

  return {
    notifications: queryResult.data?.notifications || [],
    totalCount: queryResult.data?.totalCount || 0,
    isLoading: queryResult.isLoading,
    error: queryResult.error as Error | null,
    isFetching: queryResult.isFetching,
  }
}
